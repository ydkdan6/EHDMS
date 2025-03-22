import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

interface RegisterForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  verificationCode?: string;
}

const RESTRICTED_ROLES = ['hospital', 'responder'];

export const RegisterPage: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedRole = watch('role');
  const needsVerification = RESTRICTED_ROLES.includes(selectedRole as UserRole);

  // Simple validation function that checks the code against the database
  const validateCode = async (code: string, role: string): Promise<boolean> => {
    if (!code || !role) return false;
    
    try {
      // Log the attempt for debugging
      console.log(`Checking code: "${code}" for role: "${role}"`);
      
      // Query the verification_codes table
      const { data, error } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('code', code)
        .eq('role', role)
        .limit(1);
      
      if (error) {
        console.error('Verification query error:', error);
        return false;
      }
      
      // Check if we got any results
      const isValid = Array.isArray(data) && data.length > 0;
      console.log('Verification result:', isValid ? 'Valid code found' : 'No valid code found');
      
      return isValid;
    } catch (err) {
      console.error('Verification error:', err);
      return false;
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsSubmitting(true);

      // Check verification code if required
      if (needsVerification) {
        const codeValid = await validateCode(data.verificationCode || '', data.role);
        
        if (!codeValid) {
          toast.error('Invalid verification code for your selected role');
          setIsSubmitting(false);
          return;
        }
      }

      // First sign up the user with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone_number: data.phoneNumber,
            role: data.role
          }
        }
      });

      if (signUpError) {
        toast.error(signUpError.message || 'Registration failed');
        setIsSubmitting(false);
        return;
      }

      if (authData.user) {
        // Insert the user data into the users table
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            phone_number: data.phoneNumber,
            role: data.role
          }]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          toast.error('Failed to create user profile. Please try again.');
          setIsSubmitting(false);
          return;
        }

        // If we got here, everything worked - delete the verification code if used
        if (needsVerification && data.verificationCode) {
          // Attempt to delete the used code - don't wait for this
          supabase
            .from('verification_codes')
            .delete()
            .eq('code', data.verificationCode)
            .eq('role', data.role)
            .then(({ error }) => {
              if (error) console.log('Failed to delete used code:', error);
            });
        }

        toast.success('Registration successful! Please sign in.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  {...register('email', { required: 'Email is required' })}
                  type="email"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  {...register('password', { required: 'Password is required', minLength: 6 })}
                  type="password"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <div className="mt-1">
                  <input
                    {...register('firstName', { required: 'First name is required' })}
                    type="text"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <div className="mt-1">
                  <input
                    {...register('lastName', { required: 'Last name is required' })}
                    type="text"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  {...register('phoneNumber', { required: 'Phone number is required' })}
                  type="tel"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <div className="mt-1">
                <select
                  {...register('role', { required: 'Role is required' })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="patient">Patient</option>
                  <option value="responder">Emergency Responder (Requires Verification)</option>
                  <option value="hospital">Hospital Staff (Requires Verification)</option>
                </select>
              </div>
            </div>

            {needsVerification && (
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <div className="mt-1">
                  <input
                    {...register('verificationCode', { 
                      required: needsVerification ? 'Verification code is required for this role' : false 
                    })}
                    type="text"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your verification code"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Please contact your administrator to get a verification code.
                  </p>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign in
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};