const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const mongoose = require("mongoose");
const emailService = require("../services/email.service");

/**
THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check account status
     * 4. Derive sender balance from ledger
     * 5. Create transaction (PENDING)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction COMPLETED
     * 9. Commit MongoDB session
     * 10. Send email notification
 */

async function createTransaction(req, res) {
  /*
    `1. Validate request`
    */

  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const fromUserAccount = await accountModel.findOne({ _id: fromAccount });

  const toUserAccount = await accountModel.findOne({ _id: toAccount });

  if (!fromUserAccount || !toUserAccount) {
    return res.status(404).json({ message: "One or both accounts not found" });
  }
  /*
        `2. Validate idempotency key`
        */

  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction already completed",
        transaction: isTransactionAlreadyExists,
      });
    }
    if (isTransactionAlreadyExists.status === "PENDING") {
      return res.status(200).json({ message: "Transaction is pending" });
    }

    if (isTransactionAlreadyExists.status === "FAILED") {
      return res.status(200).json({ message: "Transaction failed retry" });
    }
    if (isTransactionAlreadyExists.status === "REVERSED") {
      return res.status(200).json({ message: "Transaction reversed retry" });
    }
  }

  /*
            `3. Check account status`
            */
  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res
      .status(400)
      .json({ message: "One or both accounts are not active" });
  }

  /*
       `4. Derive sender balance from ledger`
            */
  const balance = await fromUserAccount.getBalance();
  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient funds. Available balance: ${balance}.Request amount: ${amount}`,
    });
  }

  /*
         `5. Create transaction (PENDING)`
                */
  let transaction;
  try{
  const session = await mongoose.startSession();
  session.startTransaction();

  transaction = (
    await transactionModel.create(
      [
        {
          fromAccount,
          toAccount,
          amount,
          idempotencyKey,
          status: "PENDING",
        },
      ],
      { session },
    )
  )[0];

  const debitedLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],
    { session },
  );

  await(()=>{
    return new Promise((reslove)=>setTimeout(reslove,15*1000));
  })()

  const creditedLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],
    { session },
  );

  await transactionModel.findByIdAndUpdate(
    {
      _id: transaction._id,
    },
    {
      status: "COMPLETED",
    },
    { session },
  );

  await session.commitTransaction();
  session.endSession();
} catch (error) {
  return res.status(400).json({
    message:"Transaction is Pending due to some error",
    error: error.message,
  });
}

  /*
            `10. Send email notification`   
            */
  await emailService.sendTransactionEmail(
    req.user.email,
    req.user.name,
    amount,
    toAccount,
  );

  return res.status(201).json({
    message: "Transaction successful",
    transaction: transaction,
  });
}

async function createIntitalFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;
  console.log(toAccount, amount, idempotencyKey);

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const toUserAccount = await accountModel.findOne({
    _id: toAccount
  });
  console.log(toUserAccount);

  if (!toUserAccount) {
    return res.status(400).json({
      message: " System Account not found",
    });
  }
  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });
  if (!fromUserAccount) {
    return res.status(400).json({
      message: "System account not found",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING",
  });
  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],
    { session },
  );
  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],
    { session }
  );

  transaction.status = "COMPLETED";
  await transaction.save({ session });
  await session.commitTransaction();
  session.endSession();

  return res.status(201).json({
    message: "Initial funds transfer successful",
    transaction: transaction,
  });
}
module.exports = {
  createTransaction,
  createIntitalFundsTransaction,
};
