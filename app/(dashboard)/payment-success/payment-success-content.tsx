'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import Link from 'next/link';

interface VerificationResponse {
  status: string;
  paymentMethod?: {
    type: string;
    card?: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
    bank_account?: {
      bank_name: string;
      last4: string;
    };
  };
  customerId?: string;
  error?: string;
}

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<VerificationResponse | null>(null);

  const sessionId = searchParams.get('sessionId');
  const scope = searchParams.get('scope');
  const id = searchParams.get('id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/payments/verify?sessionId=${sessionId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token') || ''}`,
            },
          }
        );

        const data = await response.json();
        setVerificationData(data);

        if (response.ok && data.status === 'paid') {
          setVerified(true);
        } else {
          setError(data.error || 'Payment verification failed');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Verification failed';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-md w-full px-6">
          {loading ? (
            <div className="text-center">
              <div className="animate-spin inline-block w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full mb-4"></div>
              <p className="text-gray-600 font-semibold">Verifying payment...</p>
              <p className="text-sm text-gray-500 mt-2">Session ID: {sessionId}</p>
            </div>
          ) : verified && verificationData?.status === 'paid' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-6">
                Your payment has been processed successfully.
              </p>

              {verificationData?.paymentMethod && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Type:</span>{' '}
                      <span className="font-medium">
                        {verificationData.paymentMethod.type}
                      </span>
                    </p>
                    {verificationData.paymentMethod.card && (
                      <>
                        <p>
                          <span className="text-gray-600">Card:</span>{' '}
                          <span className="font-medium">
                            {verificationData.paymentMethod.card.brand.toUpperCase()} •••• •••• •••• {verificationData.paymentMethod.card.last4}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">Expires:</span>{' '}
                          <span className="font-medium">
                            {verificationData.paymentMethod.card.exp_month}/
                            {verificationData.paymentMethod.card.exp_year}
                          </span>
                        </p>
                      </>
                    )}
                    {verificationData.paymentMethod.bank_account && (
                      <>
                        <p>
                          <span className="text-gray-600">Bank:</span>{' '}
                          <span className="font-medium">
                            {verificationData.paymentMethod.bank_account.bank_name}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">Account:</span>{' '}
                          <span className="font-medium">
                            •••• {verificationData.paymentMethod.bank_account.last4}
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {verificationData && (
                <details className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-left text-xs">
                  <summary className="cursor-pointer font-semibold text-blue-900 mb-3">
                    API Response
                  </summary>
                  <pre className="bg-gray-800 text-green-400 p-2 rounded overflow-auto">
                    {JSON.stringify(verificationData, null, 2)}
                  </pre>
                </details>
              )}

              <div className="space-y-3">
                {scope === 'course' && id && (
                  <Link
                    href={`/courses/${id}`}
                    className="block w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                  >
                    Go to Course
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="block w-full bg-gray-100 text-gray-900 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
              <p className="text-gray-600 mb-2">{error || 'Payment could not be verified'}</p>
              <p className="text-sm text-gray-500 mb-6">Session ID: {sessionId}</p>

              {verificationData && (
                <details className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-left text-xs">
                  <summary className="cursor-pointer font-semibold text-red-900 mb-3">
                    Error Details
                  </summary>
                  <pre className="bg-gray-800 text-red-400 p-2 rounded overflow-auto">
                    {JSON.stringify(verificationData, null, 2)}
                  </pre>
                </details>
              )}

              <div className="space-y-3">
                <Link
                  href="/payment-demo"
                  className="block w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                >
                  Try Again
                </Link>
                <Link
                  href="/dashboard"
                  className="block w-full bg-gray-100 text-gray-900 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
