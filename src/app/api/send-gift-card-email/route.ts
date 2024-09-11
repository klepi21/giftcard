import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, giftCardCode, sessions, frontImage, backImage } = await request.json();

    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT as string, 10),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    } as nodemailer.TransportOptions);

    await transporter.sendMail({
      from: '"Avgouste" <mailtrap@demomailtrap.com>',
      to: email,
      subject: "Your Acupuncture Gift Card",
      html: `
        <h1>Δωροκάρτα Βελονισμού</h1>
        <p>Κωδικός δωροκάρτας: ${giftCardCode}</p>
        <p>Αριθμός συνεδρίων: ${sessions}</p>
      `,
      attachments: [
        {
          filename: 'gift-card-front.png',
          content: frontImage.split('base64,')[1],
          encoding: 'base64'
        },
        {
          filename: 'gift-card-back.png',
          content: backImage.split('base64,')[1],
          encoding: 'base64'
        }
      ]
    });

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ 
      message: 'Error sending email', 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
