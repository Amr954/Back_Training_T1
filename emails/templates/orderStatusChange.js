const escapeHtml = (value = '') =>
    String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[char]);


const orderStatusChangedEmail = ({
    userName,
    orderId,
    oldStatus,
    newStatus,
    adminNote,
}) => {
    // Escape dynamic values before inserting them into HTML
    const safeUserName = escapeHtml(userName);
    const safeOrderId = escapeHtml(orderId);
    const safeOldStatus = escapeHtml(oldStatus);
    const safeNewStatus = escapeHtml(newStatus);
    const safeAdminNote = escapeHtml(adminNote ?? '');

    return {
        subject: `Alpha Store - Order Status Updated (${newStatus})`,

        // Plain-text email
        text: `
Hello ${userName},

The status of your Alpha Store order has been updated.

Order ID: ${orderId}

Previous status: ${oldStatus}
New status: ${newStatus}
${adminNote ? `\nMessage from Alpha Store:\n${adminNote}\n` : ''}
You can contact Alpha Store support if you have any questions about your order.

Best regards,
Alpha Store Team
`,

        // HTML email
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Alpha Store - Order Status Updated</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background: #f3f4f6;
    font-family: Arial, Helvetica, sans-serif;
">

    <div style="padding: 40px 15px;">

        <div style="
            max-width: 600px;
            margin: auto;
            background: #ffffff;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        ">

            <!-- HEADER -->

            <div style="
                background: #111827;
                padding: 30px;
                text-align: center;
            ">

                <h1 style="
                    margin: 0;
                    color: #ffffff;
                    font-size: 28px;
                ">
                    Alpha Store
                </h1>

                <p style="
                    margin: 8px 0 0;
                    color: #d1d5db;
                    font-size: 14px;
                ">
                    Order Notification
                </p>

            </div>


            <!-- CONTENT -->

            <div style="padding: 35px;">

                <h2 style="
                    margin-top: 0;
                    color: #111827;
                    font-size: 23px;
                ">
                    Your order status has been updated
                </h2>

                <p style="
                    color: #374151;
                    font-size: 15px;
                    line-height: 1.7;
                ">
                    Hello <strong>${safeUserName}</strong>,
                </p>

                <p style="
                    color: #4b5563;
                    font-size: 15px;
                    line-height: 1.7;
                ">
                    The status of your Alpha Store order has changed.
                    Here are the details of the update.
                </p>


                <!-- ORDER ID CARD -->

                <div style="
                    margin: 25px 0;
                    padding: 18px;
                    background: #f9fafb;
                    border-radius: 10px;
                    border: 1px solid #e5e7eb;
                ">

                    <p style="
                        margin: 0 0 8px;
                        color: #6b7280;
                        font-size: 12px;
                        font-weight: bold;
                        letter-spacing: 1px;
                    ">
                        ORDER ID
                    </p>

                    <p style="
                        margin: 0;
                        color: #111827;
                        font-size: 15px;
                        font-weight: bold;
                        word-break: break-word;
                    ">
                        ${safeOrderId}
                    </p>

                </div>


                <!-- STATUS CHANGE CARD -->

                <div style="
                    margin: 25px 0;
                    padding: 22px;
                    background: #f9fafb;
                    border-radius: 10px;
                    border: 1px solid #e5e7eb;
                ">

                    <p style="
                        margin: 0 0 20px;
                        color: #6b7280;
                        font-size: 12px;
                        font-weight: bold;
                        letter-spacing: 1px;
                    ">
                        STATUS UPDATE
                    </p>

                    <div style="
                        font-size: 16px;
                        text-align: center;
                    ">

                        <span style="
                            display: inline-block;
                            padding: 8px 12px;
                            margin: 5px 0;
                            background: #e5e7eb;
                            color: #4b5563;
                            border-radius: 6px;
                            text-decoration: line-through;
                        ">
                            ${safeOldStatus}
                        </span>

                        <span style="
                            display: inline-block;
                            margin: 0 8px;
                            color: #9ca3af;
                            font-size: 20px;
                        ">
                            →
                        </span>

                        <strong style="
                            display: inline-block;
                            padding: 8px 12px;
                            margin: 5px 0;
                            background: #dcfce7;
                            color: #166534;
                            border-radius: 6px;
                        ">
                            ${safeNewStatus}
                        </strong>

                    </div>

                </div>


                <!-- OPTIONAL ADMIN NOTE -->

                ${adminNote?.trim()
                ? `
                <div style="
                    margin: 25px 0;
                    padding: 22px;
                    background: #fffbeb;
                    border-radius: 10px;
                    border: 1px solid #fde68a;
                ">

                    <h3 style="
                        margin: 0 0 12px;
                        color: #92400e;
                        font-size: 16px;
                    ">
                        Message from Alpha Store
                    </h3>

                    <p style="
                        margin: 0;
                        color: #78350f;
                        font-size: 14px;
                        line-height: 1.8;
                        white-space: pre-wrap;
                        overflow-wrap: anywhere;
                    ">${safeAdminNote}</p>

                </div>
                `
                : ''
            }


                <p style="
                    color: #4b5563;
                    font-size: 15px;
                    line-height: 1.7;
                ">
                    If you have any questions about your order,
                    please contact the Alpha Store support team.
                </p>

            </div>


            <!-- FOOTER -->

            <div style="
                padding: 20px;
                background: #f9fafb;
                border-top: 1px solid #e5e7eb;
                text-align: center;
            ">

                <p style="
                    margin: 0;
                    color: #9ca3af;
                    font-size: 12px;
                ">
                    © ${new Date().getFullYear()} Alpha Store
                </p>

                <p style="
                    margin: 6px 0 0;
                    color: #9ca3af;
                    font-size: 12px;
                ">
                    This is an automated notification.
                </p>

            </div>

        </div>

    </div>

</body>
</html>
`,
    };
};

module.exports = orderStatusChangedEmail;