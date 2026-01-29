import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

export async function sendEmail(to: string, subject: string, html: string) {
    if (!process.env.SMTP_HOST) {
        console.warn("SMTP_HOST not correctly set. Email missed:", subject)
        return
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Pockett" <noreply@pockett.app>',
            to,
            subject,
            html,
        })
        console.log(`[EMAIL] Sent to ${to}. MessageId: ${info.messageId}`)
        return info
    } catch (error) {
        console.error("[EMAIL] Error sending email:", error)
        throw error
    }
}
