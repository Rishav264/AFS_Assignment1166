const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rishavsandal91@gmail.com',
    pass: 'jcmm vacp okde gkxy',
  }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  verified: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

mongoose.connect('mongodb+srv://rishavsandal91:rishav123@cluster0.v0z5xs1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/OTP')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    let user = await User.findOne({ email });

    if (user && user.verified) {
      return res.json({ message: 'Email already verified' });
    }

    const otp = generateOTP();

    if (!user) {
      user = new User({ email, otp });
    } else {
      user.otp = otp;
      user.verified = false;
    }

    await user.save();

    const mailOptions = {
      to: email,
      subject: 'Verify Your Email',
      from: 'rishavsandal91@gmail.com',
      text: `Your OTP is: ${otp}.`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email, otp });

    if (user) {
      user.verified = true;
      await user.save();
      return res.json({ message: 'Email verified successfully' });
    } else {
      return res.json({ message: 'Email verification Failed' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

app.post('/send-otp', sendOTP);
app.post('/verify-otp', verifyOTP);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
