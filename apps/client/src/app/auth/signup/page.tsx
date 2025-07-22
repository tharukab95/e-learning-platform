'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import axios from 'axios';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const { register, handleSubmit, reset } = useForm();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (data: any) => {
    setError(null);
    setSuccess(false);
    try {
      const res = await axios.post(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/auth/signup`,
        {
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (res.status === 201 || res.status === 200) {
        // Auto-login after signup
        const loginRes = await signIn('credentials', {
          redirect: false,
          email: data.email,
          password: data.password,
        });
        if (loginRes?.ok) {
          // Get the session to check the role
          const sessionRes = await fetch('/api/auth/session');
          const session = await sessionRes.json();
          const role = session?.user?.role;
          if (role === 'teacher') {
            router.push('/dashboard/teacher');
          } else if (role === 'student') {
            router.push('/dashboard/student');
          } else {
            router.push('/dashboard');
          }
        } else {
          setSuccess(true);
          reset();
        }
      } else {
        setError('Signup failed.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Signup failed.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral">
      <form
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>
        {success && (
          <div className="mb-4 text-green-600 text-center">
            Signup successful! (Demo only)
          </div>
        )}
        {error && <div className="mb-4 text-red-600 text-center">{error}</div>}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="name"
          >
            Name
          </label>
          <input
            {...register('name', { required: true })}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="name"
            type="text"
            placeholder="Name"
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="email"
          >
            Email
          </label>
          <input
            {...register('email', { required: true })}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            placeholder="Email"
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="password"
          >
            Password
          </label>
          <input
            {...register('password', { required: true })}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="********"
          />
        </div>
        <div className="mb-6">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="role"
          >
            Role
          </label>
          <select
            {...register('role', { required: true })}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="role"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        <button
          className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          type="submit"
        >
          Sign Up
        </button>
        <div className="mt-6 text-center">
          <span className="text-gray-600">Already have an account? </span>
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
