export const roleChangedEmail = ({
    userName,
    oldRole,
    newRole,
}) => ({
    subject: "Your Alpha Store role has been updated",

    text: `
Hello ${userName},

Your role on Alpha Store has been updated.

Previous role: ${oldRole}
New role: ${newRole}

Your new permissions are now active.

If you believe this change was made by mistake, please contact Alpha Store support.

Best regards,
Alpha Store Team
`,

    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Alpha Store - Role Updated</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background: #f3f4f6;
    font-family: Arial, Helvetica, sans-serif;
">

    <div style="
        padding: 40px 15px;
    ">

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
                    Account Notification
                </p>

            </div>


            <!-- CONTENT -->

            <div style="
                padding: 35px;
            ">

                <h2 style="
                    margin-top: 0;
                    color: #111827;
                    font-size: 23px;
                ">
                    Your role has been updated
                </h2>


                <p style="
                    color: #374151;
                    font-size: 15px;
                    line-height: 1.7;
                ">
                    Hello <strong>${userName}</strong>,
                </p>


                <p style="
                    color: #4b5563;
                    font-size: 15px;
                    line-height: 1.7;
                ">
                    An administrator has changed the role associated
                    with your Alpha Store account.
                </p>


                <!-- ROLE CHANGE CARD -->

                <div style="
                    margin: 25px 0;
                    padding: 22px;
                    background: #f9fafb;
                    border-radius: 10px;
                    border: 1px solid #e5e7eb;
                ">

                    <p style="
                        margin: 0 0 15px;
                        color: #6b7280;
                        font-size: 12px;
                        font-weight: bold;
                        letter-spacing: 1px;
                    ">
                        ROLE CHANGE
                    </p>


                    <div style="
                        font-size: 17px;
                        text-align: center;
                    ">

                        <span style="
                            color: #9ca3af;
                            text-decoration: line-through;
                        ">
                            ${oldRole}
                        </span>


                        <span style="
                            margin: 0 15px;
                            color: #9ca3af;
                            font-size: 20px;
                        ">
                            →
                        </span>


                        <strong style="
                            color: #111827;
                        ">
                            ${newRole}
                        </strong>

                    </div>

                </div>


                <p style="
                    color: #4b5563;
                    font-size: 15px;
                    line-height: 1.7;
                ">
                    Your new permissions are now active.
                </p>


                <p style="
                    color: #4b5563;
                    font-size: 15px;
                    line-height: 1.7;
                ">
                    If you believe this change was made by mistake,
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
});