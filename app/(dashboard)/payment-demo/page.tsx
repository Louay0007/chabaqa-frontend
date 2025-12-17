'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

interface Course {
  _id: string;
  titre: string;
  description: string;
  prix: number;
  creatorId: string;
}

interface PaymentResponse {
  checkoutUrl?: string;
  sessionId?: string;
  provider?: string;
  error?: string;
}

interface MockCourse extends Course {
  creator: string;
  level: string;
}

interface User {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
}

export default function PaymentDemoPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null);
  const [mockCourses, setMockCourses] = useState<MockCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [demoMode, setDemoMode] = useState(true); // For stripe test mode

  // Mock courses for testing
  const mockCoursesData: MockCourse[] = [
    {
      _id: 'course_001',
      titre: 'Introduction to Web Development',
      description: 'Learn the basics of HTML, CSS, and JavaScript',
      prix: 29.99,
      creator: 'John Developer',
      creatorId: 'creator_001',
      level: 'Beginner',
    },
    {
      _id: 'course_002',
      titre: 'Advanced React Patterns',
      description: 'Master advanced React concepts and patterns',
      prix: 49.99,
      creator: 'Jane React',
      creatorId: 'creator_002',
      level: 'Advanced',
    },
    {
      _id: 'course_003',
      titre: 'Full Stack Development',
      description: 'Complete guide to building full-stack applications',
      prix: 79.99,
      creator: 'Mike FullStack',
      creatorId: 'creator_003',
      level: 'Intermediate',
    },
  ];

  useEffect(() => {
    // Fetch user from localStorage or API
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        
        if (!token) {
          router.push('/login');
          return;
        }

        // Try to get user from localStorage first
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Optional: Verify with backend
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        try {
          const response = await fetch(`${apiBase}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (err) {
          // If API call fails, use stored user
          if (!storedUser) {
            router.push('/login');
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        router.push('/login');
      }

      // Simulate loading courses
      setTimeout(() => {
        setMockCourses(mockCoursesData);
        setLoadingCourses(false);
      }, 500);
    };

    fetchUser();
  }, [router]);

  const handleInitiatePayment = async (courseId: string) => {
    if (!user) {
      setError('You must be logged in to purchase');
      return;
    }

    if (!courseId) {
      setError('Please select a course');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setPaymentResponse(null);

    try {
      const response = await fetch('/api/payments/init/stripe-link-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          courseId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment initiation failed');
      }

      const data: PaymentResponse = await response.json();
      setPaymentResponse(data);

      if (data.checkoutUrl) {
        setSuccess('Checkout session created! Redirecting to Stripe...');
        // Redirect after 1 second
        setTimeout(() => {
          window.location.href = data.checkoutUrl || '';
        }, 1000);
      } else {
        setError('No checkout URL received from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Payment initiation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCoursePrice = (courseId: string) => {
    const course = mockCourses.find((c) => c._id === courseId);
    return course?.prix || 0;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header Section */}
          <div className="mb-16 text-center">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Payment Demo
            </h1>
            <p className="text-gray-300 text-xl max-w-2xl mx-auto">
              Experience our secure Stripe integration with test courses
            </p>
          </div>

          {/* Demo Mode Toggle */}
          <div className="mb-12 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-500/30 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <h3 className="font-bold text-xl text-blue-300">Stripe Test Mode Active</h3>
                </div>
                <p className="text-gray-300 mb-4 text-sm">
                  Use these test card numbers to simulate different payment scenarios:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-gray-400 mb-1">Success Payment</p>
                    <p className="font-mono text-sm text-green-400">4242 4242 4242 4242</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-gray-400 mb-1">Declined Card</p>
                    <p className="font-mono text-sm text-red-400">4000 0000 0000 0002</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-gray-400 mb-1">CVC</p>
                    <p className="font-mono text-sm text-blue-400">Any 3 digits</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-gray-400 mb-1">Expiry</p>
                    <p className="font-mono text-sm text-blue-400">Any future date</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                {demoMode ? '🧪 TEST MODE' : '🚀 LIVE MODE'}
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-8 bg-gradient-to-r from-red-600/10 to-orange-600/10 border border-red-500/30 rounded-xl p-6 backdrop-blur-sm animate-in slide-in-from-top">
              <div className="flex items-start gap-4">
                <div className="text-2xl">❌</div>
                <div>
                  <p className="text-red-300 font-bold mb-1">Error</p>
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-8 bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm animate-in slide-in-from-top">
              <div className="flex items-start gap-4">
                <div className="text-2xl">✅</div>
                <div>
                  <p className="text-green-300 font-bold mb-1">Success</p>
                  <p className="text-green-200 text-sm">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Response Debug */}
          {paymentResponse && (
            <div className="mb-12 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="font-bold text-xl text-purple-300 mb-4 flex items-center gap-2">
                <span>📋</span> API Response
              </h3>
              <pre className="bg-slate-900 text-green-400 p-6 rounded-lg overflow-auto text-xs border border-slate-700 shadow-inner">
                {JSON.stringify(paymentResponse, null, 2)}
              </pre>
            </div>
          )}

          {/* Courses Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Available Courses</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loadingCourses ? (
                <div className="col-span-full text-center py-16">
                  <div className="inline-flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                    <p className="text-gray-400">Loading courses...</p>
                  </div>
                </div>
              ) : mockCourses.length > 0 ? (
                mockCourses.map((course) => (
                  <div
                    key={course._id}
                    className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 transform hover:scale-105 ${
                      selectedCourse === course._id
                        ? 'border-blue-400 bg-blue-600/10 shadow-xl shadow-blue-500/20'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-600 shadow-lg'
                    }`}
                  >
                    {/* Course Header Gradient */}
                    <div className="h-40 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity">
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white opacity-20"></div>
                      </div>
                      <div className="text-center text-white relative z-10">
                        <div className="text-sm font-bold mb-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full inline-block">
                          {course.level}
                        </div>
                        <div className="text-4xl font-black">${course.prix.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Course Details */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                          {course.titre}
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">{course.description}</p>
                      </div>

                      <div className="flex items-center gap-2 pb-4 border-b border-slate-700">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600"></div>
                        <p className="text-sm text-gray-400">By <span className="text-gray-300 font-semibold">{course.creator}</span></p>
                      </div>

                      {/* Selection Radio */}
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedCourse === course._id
                            ? 'border-blue-400 bg-blue-600'
                            : 'border-gray-600'
                        }`}>
                          {selectedCourse === course._id && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-300">Select this course</span>
                        <input
                          type="radio"
                          name="course"
                          value={course._id}
                          checked={selectedCourse === course._id}
                          onChange={(e) => setSelectedCourse(e.target.value)}
                          className="hidden"
                        />
                      </label>

                      {/* Purchase Button */}
                      <button
                        onClick={() => handleInitiatePayment(course._id)}
                        disabled={loading || selectedCourse !== course._id}
                        className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                          selectedCourse === course._id
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-600/50 disabled:opacity-50 disabled:cursor-not-allowed'
                            : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {loading && selectedCourse === course._id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <span>🛒</span>
                            Buy Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <p className="text-gray-500">No courses available</p>
                </div>
              )}
            </div>
          </div>

          {/* Integration Details */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700 rounded-2xl p-10 space-y-10 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <span>⚙️</span> Integration Details
              </h2>
              <p className="text-gray-400">Complete technical overview of the payment system</p>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              {/* Backend Endpoint */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-600/50 transition-colors">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">📡</span> Backend Endpoint
                </h3>
                <div className="space-y-3">
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-600">
                    <p className="text-xs text-gray-500 mb-1">Method & Path</p>
                    <p className="font-mono text-sm text-cyan-400">POST /api/payments/init/stripe-link-course</p>
                  </div>
                  <details className="cursor-pointer">
                    <summary className="text-sm text-blue-400 hover:text-blue-300 font-semibold">View Request Body</summary>
                    <pre className="bg-slate-900 p-3 mt-3 rounded border border-slate-700 text-xs text-gray-300 overflow-auto">
{`{
  "courseId": "course_001"
}`}
                    </pre>
                  </details>
                </div>
              </div>

              {/* API Response */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-green-600/50 transition-colors">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">✅</span> Success Response
                </h3>
                <pre className="bg-slate-900 p-4 rounded border border-slate-700 text-xs text-green-400 overflow-auto">
{`{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_...",
  "provider": "stripe-link"
}`}
                </pre>
              </div>

              {/* Flow Diagram */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-purple-600/50 transition-colors md:col-span-2">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-xl">🔄</span> Payment Flow
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { num: 1, text: "User selects course and clicks 'Buy Now'" },
                    { num: 2, text: "Frontend sends courseId to backend" },
                    { num: 3, text: "Backend creates pending order & Stripe session" },
                    { num: 4, text: "Frontend redirects to Stripe checkout URL" },
                    { num: 5, text: "User completes payment on Stripe" },
                    { num: 6, text: "Redirects to success URL with sessionId" },
                  ].map((step) => (
                    <div key={step.num} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                        {step.num}
                      </div>
                      <p className="text-sm text-gray-300">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-orange-600/50 transition-colors">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">✓</span> Requirements
                </h3>
                <ul className="text-sm space-y-3">
                  {[
                    "User must be logged in",
                    "Stripe API key configured in backend",
                    "Course must exist in database",
                    "Course price must be greater than 0",
                    "Valid JWT token in Authorization header"
                  ].map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300">
                      <span className="text-green-400 font-bold mt-0.5">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-emerald-600/50 transition-colors">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">📊</span> System Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-600">
                    <span className="text-sm text-gray-400">API Connection</span>
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-400">Online</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-600">
                    <span className="text-sm text-gray-400">Stripe Status</span>
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-400">Connected</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-600">
                    <span className="text-sm text-gray-400">Test Mode</span>
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-yellow-400">Active</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-700 rounded-2xl p-8">
            <h3 className="font-bold text-white mb-6 text-lg flex items-center gap-2">
              <span className="text-xl">👤</span> Current User Profile
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                <p className="text-xs text-gray-500 mb-2">📧 Email</p>
                <p className="font-mono text-sm text-blue-300">{user?.email || 'N/A'}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                <p className="text-xs text-gray-500 mb-2">🆔 User ID</p>
                <p className="font-mono text-sm text-purple-300">{user?.id || 'N/A'}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                <p className="text-xs text-gray-500 mb-2">👑 Role</p>
                <p className="font-mono text-sm text-emerald-300">{user?.role || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
