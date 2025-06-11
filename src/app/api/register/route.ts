import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    console.log('--- USER REGISTERED SUCCESSFULLY ---');
    console.log('Name:', newUser.name);
    console.log('Email:', newUser.email);
    console.log('------------------------------------');

    return NextResponse.json({
      message: 'User registered successfully.',
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'An error occurred during registration.' }, { status: 500 });
  }
} 