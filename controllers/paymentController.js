const https = require('https');
const querystring = require('querystring');
const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Payment = require('../models/payment')(sequelize, DataTypes);

/**
 * Pre-authorize payment
 * Accepts payment details from frontend and processes payment through OPP
 */
const preAuthorizePayment = async (req, res) => {
  try {
    const {
      amount,
      currency,
      paymentBrand,
      paymentType,
      card
    } = req.body;

    // Validate required fields
    if (!amount || !currency || !paymentBrand || !paymentType) {
      return res.status(400).json({
        error: 'Missing required fields: amount, currency, paymentBrand, and paymentType are required'
      });
    }

    if (!card || !card.number || !card.holder || !card.expiryMonth || !card.expiryYear || !card.cvv) {
      return res.status(400).json({
        error: 'Missing required card details: number, holder, expiryMonth, expiryYear, and cvv are required'
      });
    }

    // Configuration - consider moving these to environment variables
    const entityId = process.env.PAYMENT_ENTITY_ID || '8ac7a4c79394bdc801939736f17e063d';
    const authorization = process.env.PAYMENT_AUTHORIZATION || 'Bearer OGFjN2E0Yzc5Mzk0YmRjODAxOTM5NzM2ZjFhNzA2NDF8enlac1lYckc4QXk6bjYzI1NHNng=';
    const paymentHost = process.env.PAYMENT_HOST || 'eu-test.oppwa.com';

    const path = '/v1/payments';
    const data = querystring.stringify({
      'entityId': entityId,
      'amount': amount,
      'currency': currency,
      'paymentBrand': paymentBrand,
      'paymentType': paymentType,
      'card.number': card.number,
      'card.holder': card.holder,
      'card.expiryMonth': card.expiryMonth,
      'card.expiryYear': card.expiryYear,
      'card.cvv': card.cvv
    });

    const options = {
      port: 443,
      host: paymentHost,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
        'Authorization': authorization
      }
    };

    // Make the payment request
    const paymentResponse = await new Promise((resolve, reject) => {
      const postRequest = https.request(options, function(response) {
        const buf = [];
        response.on('data', chunk => {
          buf.push(Buffer.from(chunk));
        });
        response.on('end', () => {
          const jsonString = Buffer.concat(buf).toString('utf8');
          try {
            const parsedResponse = JSON.parse(jsonString);
            resolve({
              statusCode: response.statusCode,
              data: parsedResponse
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });
      postRequest.on('error', (error) => {
        reject(new Error(`Payment request failed: ${error.message}`));
      });
      postRequest.write(data);
      postRequest.end();
    });

    // Get userId from authenticated user
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required'
      });
    }

    // Save payment record to database
    try {
      await Payment.create({
        userId: userId,
        currency: currency,
        amount: amount,
        paymentBrand: paymentBrand,
        paymentType: paymentType,
        card: paymentResponse.data.card || null,
        referenceId: paymentResponse.data.id || null,
        status: 'pending'
      });
    } catch (dbError) {
      console.error('Failed to save payment record:', dbError);
      // Continue even if database save fails, but log the error
    }

    // Return the payment response to the frontend
    res.status(paymentResponse.statusCode || 200).json(paymentResponse.data);

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      error: 'Payment processing failed',
      message: error.message
    });
  }
};

/**
 * Capture payment
 * Capture a pre-authorized payment by transferring reserved funds from shopper's account to merchant's account
 */
const capturePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const {
      amount,
      currency
    } = req.body;

    // Validate required fields
    if (!paymentId) {
      return res.status(400).json({
        error: 'Missing required field: paymentId is required in URL parameters'
      });
    }

    if (!amount || !currency) {
      return res.status(400).json({
        error: 'Missing required fields: amount and currency are required'
      });
    }

    // Validate amount format (should be a positive number)
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        error: 'Invalid amount: amount must be a positive number'
      });
    }

    // Try to find the pre-authorization payment record to validate
    let preAuthRecord = null;
    try {
      preAuthRecord = await Payment.findOne({
        where: { paymentId: paymentId }
      });

      // If found, validate that capture amount doesn't exceed pre-authorized amount
      if (preAuthRecord) {
        const preAuthAmount = parseFloat(preAuthRecord.amount);
        if (amountNum > preAuthAmount) {
          return res.status(400).json({
            error: 'Capture amount exceeds pre-authorized amount',
            message: `Cannot capture ${amount} ${currency}. Pre-authorized amount was ${preAuthRecord.amount} ${preAuthRecord.currency}`,
            preAuthorizedAmount: preAuthRecord.amount,
            preAuthorizedCurrency: preAuthRecord.currency,
            requestedAmount: amount,
            requestedCurrency: currency
          });
        }

        // Check if already captured
        if (preAuthRecord.status === 'success') {
          return res.status(400).json({
            error: 'Payment already captured',
            message: 'This payment has already been successfully captured',
            paymentId: paymentId
          });
        }
      }
    } catch (dbError) {
      console.warn('Could not validate pre-authorization record:', dbError);
      // Continue with capture attempt even if we can't find the record
    }

    // Configuration - consider moving these to environment variables
    const entityId = process.env.PAYMENT_ENTITY_ID || '8ac7a4c79394bdc801939736f17e063d';
    const authorization = process.env.PAYMENT_AUTHORIZATION || 'Bearer OGFjN2E0Yzc5Mzk0YmRjODAxOTM5NzM2ZjFhNzA2NDF8enlac1lYckc4QXk6bjYzI1NHNng=';
    const paymentHost = process.env.PAYMENT_HOST || 'eu-test.oppwa.com';

    const path = `/v1/payments/${paymentId}`;
    const data = querystring.stringify({
      'entityId': entityId,
      'amount': amount,
      'paymentType': 'CP',
      'currency': currency
    });

    const options = {
      port: 443,
      host: paymentHost,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
        'Authorization': authorization
      }
    };

    // Make the capture payment request
    const paymentResponse = await new Promise((resolve, reject) => {
      const postRequest = https.request(options, function(response) {
        const buf = [];
        response.on('data', chunk => {
          buf.push(Buffer.from(chunk));
        });
        response.on('end', () => {
          const jsonString = Buffer.concat(buf).toString('utf8');
          try {
            const parsedResponse = JSON.parse(jsonString);
            resolve({
              statusCode: response.statusCode,
              data: parsedResponse
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });
      postRequest.on('error', (error) => {
        reject(new Error(`Payment capture request failed: ${error.message}`));
      });
      postRequest.write(data);
      postRequest.end();
    });

    // Check for payment gateway errors
    const resultCode = paymentResponse.data.result?.code || '';
    const resultDescription = paymentResponse.data.result?.description || '';
    const isSuccess = resultCode.startsWith('000');

    // Update payment record in database using referencedId
    try {
      // Try to find payment record by the paymentId from URL (pre-authorization ID)
      let paymentRecord = await Payment.findOne({
        where: { paymentId: paymentId }
      });

      // If not found, try using referencedId from response
      if (!paymentRecord) {
        const referencedId = paymentResponse.data.referencedId || paymentResponse.data.referenceId;
        if (referencedId) {
          paymentRecord = await Payment.findOne({
            where: { paymentId: referencedId }
          });
        }
      }

      if (paymentRecord) {
        // Determine status based on result code
        const newStatus = isSuccess ? 'success' : 'failed';

        // Update the payment record
        await paymentRecord.update({
          paymentId: paymentResponse.data.id || paymentRecord.paymentId, // Update with new payment ID from capture
          referenceId: paymentResponse.data.referencedId || paymentResponse.data.referenceId || paymentId, // Store the referenced ID
          status: newStatus
        });
      } else {
        console.warn(`Payment record not found for paymentId: ${paymentId}`);
      }
    } catch (dbError) {
      console.error('Failed to update payment record:', dbError);
      // Continue even if database update fails, but log the error
    }

    // Return appropriate response based on success/failure
    if (isSuccess) {
      // Success response
      res.status(paymentResponse.statusCode || 200).json(paymentResponse.data);
    } else {
      // Error response - return 400 Bad Request for payment gateway errors
      res.status(400).json({
        error: 'Payment capture failed',
        message: resultDescription || 'Unable to capture payment',
        code: resultCode,
        details: paymentResponse.data
      });
    }

  } catch (error) {
    console.error('Payment capture error:', error);
    res.status(500).json({
      error: 'Payment capture failed',
      message: error.message
    });
  }
};

/**
 * Manage payment
 * Initiate back-office operations on a captured payment (refund, rebill, chargeback, chargeback reversal)
 */
const managePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const {
      operation,
      amount,
      currency
    } = req.body;

    // Validate required fields
    if (!paymentId) {
      return res.status(400).json({
        error: 'Missing required field: paymentId is required in URL parameters'
      });
    }

    if (!operation || !amount || !currency) {
      return res.status(400).json({
        error: 'Missing required fields: operation, amount, and currency are required'
      });
    }

    // Map operation to paymentType
    const operationMap = {
      'refund': 'RF',
      'rebill': 'RB',
      'chargeback': 'CB',
      'chargeback reversal': 'CB_RV'
    };

    const paymentType = operationMap[operation.toLowerCase()];
    if (!paymentType) {
      return res.status(400).json({
        error: 'Invalid operation. Allowed operations: refund, rebill, chargeback, chargeback reversal'
      });
    }

    // Configuration - consider moving these to environment variables
    const entityId = process.env.PAYMENT_ENTITY_ID || '8ac7a4c79394bdc801939736f17e063d';
    const authorization = process.env.PAYMENT_AUTHORIZATION || 'Bearer OGFjN2E0Yzc5Mzk0YmRjODAxOTM5NzM2ZjFhNzA2NDF8enlac1lYckc4QXk6bjYzI1NHNng=';
    const paymentHost = process.env.PAYMENT_HOST || 'eu-test.oppwa.com';

    const path = `/v1/payments/${paymentId}`;
    const data = querystring.stringify({
      'entityId': entityId,
      'amount': amount,
      'paymentType': paymentType,
      'currency': currency
    });

    const options = {
      port: 443,
      host: paymentHost,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
        'Authorization': authorization
      }
    };

    // Make the manage payment request
    const paymentResponse = await new Promise((resolve, reject) => {
      const postRequest = https.request(options, function(response) {
        const buf = [];
        response.on('data', chunk => {
          buf.push(Buffer.from(chunk));
        });
        response.on('end', () => {
          const jsonString = Buffer.concat(buf).toString('utf8');
          try {
            const parsedResponse = JSON.parse(jsonString);
            resolve({
              statusCode: response.statusCode,
              data: parsedResponse
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });
      postRequest.on('error', (error) => {
        reject(new Error(`Payment management request failed: ${error.message}`));
      });
      postRequest.write(data);
      postRequest.end();
    });

    // Update payment record in database if operation is successful
    try {
      const resultCode = paymentResponse.data.result?.code || '';
      const isSuccess = resultCode.startsWith('000');

      if (isSuccess) {
        // Get referencedId from response (this is the original payment ID)
        const referencedId = paymentResponse.data.referencedId || paymentResponse.data.referenceId;
        
        // Use referencedId to find the payment record, fallback to paymentId from URL if not found
        const searchId = referencedId || paymentId;
        
        const paymentRecord = await Payment.findOne({
          where: { paymentId: searchId }
        });

        if (paymentRecord) {
          // Update status based on operation
          let newStatus = paymentRecord.status;
          if (operation.toLowerCase() === 'refund') {
            newStatus = 'refunded';
          } else if (operation.toLowerCase() === 'chargeback') {
            newStatus = 'chargeback';
          } else if (operation.toLowerCase() === 'chargeback reversal') {
            newStatus = 'chargeback_reversed';
          }
          // For rebill, status might remain 'success' or could be updated based on business logic

          await paymentRecord.update({
            status: newStatus
          });
        } else {
          console.warn(`Payment record not found for paymentId: ${searchId}`);
        }
      }
    } catch (dbError) {
      console.error('Failed to update payment record:', dbError);
      // Continue even if database update fails, but log the error
    }

    // Return the payment response to the frontend
    res.status(paymentResponse.statusCode || 200).json(paymentResponse.data);

  } catch (error) {
    console.error('Payment management error:', error);
    res.status(500).json({
      error: 'Payment management failed',
      message: error.message
    });
  }
};

/**
 * Get user payment history
 * Fetch all payment records for the authenticated user
 */
const userPaymentHistory = async (req, res) => {
  try {
    // Get userId from authenticated user
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required'
      });
    }

    // Optional query parameters for filtering
    const { status, limit, offset } = req.query;

    // Build where clause
    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    // Build query options
    const queryOptions = {
      where: whereClause,
      order: [['createdAt', 'DESC']], // Newest first
    };

    // Add pagination if provided
    if (limit) {
      queryOptions.limit = parseInt(limit, 10);
    }
    if (offset) {
      queryOptions.offset = parseInt(offset, 10);
    }

    // Fetch payments from database
    const payments = await Payment.findAll(queryOptions);

    // Get total count for pagination info
    const totalCount = await Payment.count({ where: whereClause });

    // Return payment history
    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total: totalCount,
        limit: queryOptions.limit || totalCount,
        offset: queryOptions.offset || 0,
        count: payments.length
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      error: 'Failed to fetch payment history',
      message: error.message
    });
  }
};

module.exports = {
  preAuthorizePayment,
  capturePayment,
  managePayment,
  userPaymentHistory
};

