"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import Image from 'next/image';

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onBlur',
  });

  const onSubmit = () => {
    // console.log(data);
  };

  return (
    <div className="pr-32 flex flex-col justify-center items-center min-h-screen bg-white">
      <div className="text-lg font-normal mb-1 w-full max-w-sm">
        <span className='text-[26px] text-black font-bold flex'>Welcome back</span>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm text-center relative"
      >
        <h2 className="text-left text-[44px] font-semibold mb-2">Log in</h2>
        <p className="text-left text-[#696969] text-[15px] mb-8">Teach using the Power of Generative AI</p>

        <div className="relative mb-4">
          <Image
            src="./Mail.svg"
            width={24} height={24} alt="Email Icon"
            className="absolute left-2 top-[15px] transform -translate-y-1/2"
          />
          <input
            id="email"
            type="email"
            placeholder="Email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
            className={`border-b-2 border-black w-full pl-10 py-2 pr-8 text-gray-700 focus:outline-none focus:shadow-none ${
              errors.email ? 'border-red-500' : ''
            }`}
          />
          {isValid && !errors.email && (
            <Image
              src="./Check circle.svg"
              width={20} height={20} alt="Checkmark Icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            />
          )}
          {errors.email && typeof errors.email.message === 'string' && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div className="relative mb-6">
          <Image
            src="./Key.svg"
            width={24} height={24} alt="Lock Icon"
            className="absolute left-2 top-[15px] transform -translate-y-1/2"
          />
          <input
            id="password"
            type="password"
            placeholder="Password"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters long',
              },
            })}
            className={`border-b-2 border-black w-full pl-10 py-2 pr-8 text-gray-700 focus:outline-none focus:shadow-none ${
              errors.password ? 'border-red-500' : ''
            }`}
          />
          {isValid && !errors.password && (
            <Image
              src="./Check circle.svg"
              width={20} height={20} alt="Checkmark Icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            />
          )}
          {errors.password && typeof errors.password.message === 'string' && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex flex-col gap-4 text-left items-center pt-6 mb-6">
          <button
            type="submit"
            className="bg-[#2C2C2C] text-white font-light text-[16px] py-2 px-6 rounded-md focus:outline-none focus:shadow-outline"
          >
            Sign in
          </button>
          <span className="text-[#A1A1A1]">or</span>
          
   
          <div className="flex gap-4">
            <button className="bg-white text-black border border-black py-2 px-4 rounded-md flex items-center gap-2">
              <Image src="/google.svg" width={20} height={20} alt="Google Icon" />
              <span>Sign in with Google</span>
            </button>
            <button className="bg-white text-black border border-black py-2 px-4 rounded-md flex items-center gap-2">
              <Image src="/github.svg" width={20} height={20} alt="GitHub Icon" />
              <span>Sign in with GitHub</span>
            </button>
          </div>
        </div>

        <div className="text-left flex gap-2 text-sm">
          <span className="text-left text-[#696969]">New member?</span>
          <a href="/signup" className="font-bold text-[#354AB0]">Sign up</a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
