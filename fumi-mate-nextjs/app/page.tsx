'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [activeTab, setActiveTab] = useState('flavors');

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-bg min-h-[70vh] flex flex-col justify-center items-start px-8 md:px-16 lg:px-24">
        <h1 className="text-5xl md:text-7xl font-title font-bold text-white mb-6 leading-tight">
          You came to<br />the right place
        </h1>
        <p className="japanese-text text-white text-lg md:text-xl max-w-3xl leading-relaxed">
          日本語の勉強が好きです。
          毎日、学校で日本語を勉強します。<br />
          先生はとてもやさしくて、クラスの友だちはみんな親切です。<br />
          休みの日には家でアニメを見たり、簡単な本を読んだりします。<br />
          日本に行って、本当に日本語で話せるようになりたいです。
        </p>
      </section>

      {/* Explore Section */}
      <section className="section-padding bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-title font-bold mb-4">Essence of Nippon</h1>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab('flavors')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'flavors'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              Flavors
            </button>
            <button
              onClick={() => setActiveTab('culture')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'culture'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              Culture
            </button>
            <button
              onClick={() => setActiveTab('otaku')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'otaku'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              Otaku Zone
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'news'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              News
            </button>
            <button
              onClick={() => setActiveTab('spirit')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'spirit'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              Spirit
            </button>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeTab === 'flavors' && (
              <>
                <div className="bg-white rounded-lg shadow-md border border-gray-800 p-6 card-hover">
                  <Link href="/topics/detail">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-700">This is for tasty Japan</p>
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">14</span>
                    </div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">🍜</span>
                    </div>
                  </Link>
                </div>
                <div className="bg-white rounded-lg shadow-md border border-gray-800 p-6 card-hover">
                  <Link href="/topics/detail">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-700">Japanese cuisine culture</p>
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">75</span>
                    </div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">🍱</span>
                    </div>
                  </Link>
                </div>
                <div className="bg-white rounded-lg shadow-md border border-gray-800 p-6 card-hover">
                  <Link href="/topics/detail">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-700">Traditional tea ceremony</p>
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">100</span>
                    </div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">🍵</span>
                    </div>
                  </Link>
                </div>
                <div className="bg-white rounded-lg shadow-md border border-gray-800 p-6 card-hover">
                  <Link href="/topics/detail">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-700">Sake and Japanese drinks</p>
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">88</span>
                    </div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">🍶</span>
                    </div>
                  </Link>
                </div>
              </>
            )}

            {activeTab === 'culture' && (
              <>
                <div className="bg-white rounded-lg shadow-md p-6 card-hover">
                  <Link href="/topics/detail">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-700">Traditional festivals</p>
                      <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm">30</span>
                    </div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">🎎</span>
                    </div>
                  </Link>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 card-hover">
                  <Link href="/topics/detail">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-700">Kimono and traditional wear</p>
                      <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm">65</span>
                    </div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">👘</span>
                    </div>
                  </Link>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 card-hover">
                  <Link href="/topics/detail">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-700">Japanese gardens</p>
                      <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm">50</span>
                    </div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">🏯</span>
                    </div>
                  </Link>
                </div>
              </>
            )}

            {activeTab === 'otaku' && (
              <>
                <div className="bg-white rounded-lg shadow-md p-6 card-hover">
                  <Link href="/topics/detail">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-700">Anime culture</p>
                      <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm">120</span>
                    </div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">📺</span>
                    </div>
                  </Link>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 card-hover">
                  <Link href="/topics/detail">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-700">Manga and comics</p>
                      <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm">95</span>
                    </div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">📚</span>
                    </div>
                  </Link>
                </div>
              </>
            )}

            {activeTab === 'news' && (
              <>
                <div className="bg-white rounded-lg shadow-md p-6 card-hover">
                  <Link href="/topics/detail">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-700">Latest from Tokyo</p>
                      <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm">45</span>
                    </div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">📰</span>
                    </div>
                  </Link>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 card-hover">
                  <Link href="/topics/detail">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-700">Technology trends</p>
                      <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm">60</span>
                    </div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">💻</span>
                    </div>
                  </Link>
                </div>
              </>
            )}

            {activeTab === 'spirit' && (
              <>
                <div className="bg-white rounded-lg shadow-md p-6 card-hover">
                  <Link href="/topics/detail">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-700">Zen and meditation</p>
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">80</span>
                    </div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">🧘</span>
                    </div>
                  </Link>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 card-hover">
                  <Link href="/topics/detail">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-700">Martial arts philosophy</p>
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">75</span>
                    </div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">🥋</span>
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-title font-bold mb-8">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <details className="bg-white rounded-lg shadow-md p-4">
                  <summary className="font-semibold cursor-pointer">What is 文メイト?</summary>
                  <p className="mt-2 text-gray-600">
                    文メイト is an AI-powered Japanese learning platform that helps you master writing through personalized feedback and practice.
                  </p>
                </details>
                <details className="bg-white rounded-lg shadow-md p-4">
                  <summary className="font-semibold cursor-pointer">How does the AI feedback work?</summary>
                  <p className="mt-2 text-gray-600">
                    Our AI analyzes your writing for grammar, vocabulary, structure, and fluency, providing detailed feedback and actionable improvement plans.
                  </p>
                </details>
                <details className="bg-white rounded-lg shadow-md p-4">
                  <summary className="font-semibold cursor-pointer">Is it suitable for beginners?</summary>
                  <p className="mt-2 text-gray-600">
                    Yes! We support all JLPT levels from N5 (beginner) to N1 (advanced). The platform adapts to your level.
                  </p>
                </details>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-md h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-8xl">❓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding bg-gray-50" id="contact">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-title font-bold text-center mb-12">Get in touch</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2595.065641062665!2d-122.4230416990949!3d37.80335401520422!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80858127459fabad%3A0x808ba520e5e9edb7!2sFrancisco%20Park!5e1!3m2!1sen!2sth!4v1684340239744!5m2!1sen!2sth"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                className="rounded-lg"
              ></iframe>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Head office</h4>
              <p className="text-gray-600 mb-4">Bay St &amp;, Larkin St, San Francisco, CA 94109, United States</p>
              <hr className="my-4" />
              <p className="text-gray-600 mb-2">
                <span className="font-semibold">Phone:</span>{' '}
                <a href="tel:305-240-9671" className="text-primary hover:underline">
                  305-240-9671
                </a>
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Email:</span>{' '}
                <a href="mailto:info@company.com" className="text-primary hover:underline">
                  info@company.com
                </a>
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Dubai office</h4>
              <p className="text-gray-600 mb-4">Burj Park, Downtown Dubai, United Arab Emirates</p>
              <hr className="my-4" />
              <p className="text-gray-600 mb-2">
                <span className="font-semibold">Phone:</span>{' '}
                <a href="tel:110-220-3400" className="text-primary hover:underline">
                  110-220-3400
                </a>
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Email:</span>{' '}
                <a href="mailto:info@company.com" className="text-primary hover:underline">
                  info@company.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
