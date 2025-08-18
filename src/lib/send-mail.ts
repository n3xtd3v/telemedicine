"use server";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_EMAIL_PASSWORD,
  },
});

async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  try {
    const mailOptions = {
      from: {
        name: "TeleMed MedPark Hospital",
        address: "applications.portal.d3v@gmail.com",
      },
      to,
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);

    return { success: true, message: "Email sent successfully. 🎉" };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to send email! 😱");
  }
}

type sendInviteEmail = {
  to: string[];
  topic: string;
  description: string | null;
  link: string;
  starts_at: Date;
};

export const sendInviteEmail = async ({
  to,
  topic,
  description,
  link,
  starts_at,
}: sendInviteEmail) => {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(starts_at);

  const sendPromises = to.map((email) =>
    sendMail({
      to: email,
      subject: `${topic}`,
      text: `You are invited to a meeting.\n\nTopic: ${topic}\nDescription: ${description}\nTime: ${formattedDate}\n\nJoin Meeting: ${link}\n\nLooking forward to seeing you!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #0061ff; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">Meeting Invitation</h2>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-bottom: 10px;"><strong>Topic:</strong> ${topic}</p>
            <p style="font-size: 16px; margin-bottom: 10px;"><strong>Description:</strong> ${description}</p>
            <p style="font-size: 16px; margin-bottom: 10px;"><strong>Time:</strong> ${formattedDate}</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" target="_blank" style="background-color: #0061ff; color: white; text-decoration: none; padding: 12px 24px; font-size: 16px; border-radius: 6px; display: inline-block;">
                Join Meeting
              </a>
            </div>
            <p style="font-size: 14px; color: #555;">If the button doesn’t work, copy and paste this link into your browser:</p>
            <p style="font-size: 14px; color: #0061ff; word-break: break-word;">${link}</p>
          </div>
          <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            This invitation was sent from Applications Portal (no-reply). 🤖
          </div>
        </div>
      `,
    })
  );

  return Promise.all(sendPromises);
};
