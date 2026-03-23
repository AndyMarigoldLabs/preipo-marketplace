'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Modal available for future use
import { DEAL_ROOM_EXPIRY_DAYS, PLATFORM_DISCLAIMER } from '@/lib/constants';
import {
  ArrowLeft,
  Send,
  FileText,
  Upload,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Hash,
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'system' | 'user' | 'counterparty';
  content: string;
  timestamp: Date;
}

interface SharedDocument {
  id: string;
  name: string;
  hash: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export default function DealRoomPage() {
  const params = useParams();
  const dealId = params.id as string;
  const { isAuthenticated } = useAuth();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docUploadRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'sys-1',
      sender: 'system',
      content:
        'Deal room created for Listing #4821 - Series B Preferred Shares. Both parties have been connected.',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: 'sys-2',
      sender: 'system',
      content:
        'Please exchange NDAs before sharing proprietary information.',
      timestamp: new Date(Date.now() - 3500000),
    },
    {
      id: 'sys-3',
      sender: 'system',
      content:
        'Reminder: All communications in this deal room are logged for compliance purposes.',
      timestamp: new Date(Date.now() - 3400000),
    },
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([
    {
      id: 'doc-1',
      name: 'Mutual_NDA_v2.pdf',
      hash: '0x7a3b...f91e',
      uploadedBy: 'Seller',
      uploadedAt: new Date(Date.now() - 7200000),
    },
    {
      id: 'doc-2',
      name: 'Cap_Table_Summary.xlsx',
      hash: '0x4c8d...a22b',
      uploadedBy: 'Seller',
      uploadedAt: new Date(Date.now() - 5400000),
    },
  ]);

  const [pricePerShare, setPricePerShare] = useState('');
  const [quantity, setQuantity] = useState('');
  const [dealMemoGenerated, setDealMemoGenerated] = useState(false);
  const [termsHash, setTermsHash] = useState('');
  const [signed, setSigned] = useState(false);
  const [recordingOnChain, setRecordingOnChain] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [expiryDays] = useState(DEAL_ROOM_EXPIRY_DAYS ?? 60);

  const totalDealValue =
    pricePerShare && quantity
      ? (parseFloat(pricePerShare) * parseFloat(quantity)).toLocaleString(
          'en-US',
          { style: 'currency', currency: 'USD' }
        )
      : '$0.00';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isAuthenticated === false) {
      window.location.href = '/onboarding';
    }
  }, [isAuthenticated]);

  if (isAuthenticated === false) {
    return null;
  }

  const handleSendMessage = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    const msg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    setNewMessage('');
    setUploadedFileName(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeHash = `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`;
      const newDoc: SharedDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        hash: fakeHash,
        uploadedBy: 'You',
        uploadedAt: new Date(),
      };
      setSharedDocuments((prev) => [...prev, newDoc]);
    }
  };

  const handleGenerateDealMemo = () => {
    if (!pricePerShare || !quantity) return;
    const hash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
    setTermsHash(hash);
    setDealMemoGenerated(true);
    setSigned(false);
    setTxHash(null);
  };

  const handleSign = () => {
    setSigned(true);
  };

  const handleRecordOnChain = () => {
    setRecordingOnChain(true);
    setTimeout(() => {
      const fakeTx = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
      setTxHash(fakeTx);
      setRecordingOnChain(false);
    }, 2000);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/listings"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to listings
              </Link>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Deal Room #{dealId}
              </h1>
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800">
                Active
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Expires in {expiryDays} days
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Shield className="w-3 h-3" />
            This is a private communication channel between buyer and seller.
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chat */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 flex flex-col min-h-[600px]">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Messages
                </h2>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      {msg.sender === 'system' ? (
                        <div className="w-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg px-4 py-2 text-sm text-blue-800 dark:text-blue-300">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-3 h-3" />
                            <span className="font-medium text-xs">System</span>
                            <span className="text-xs text-blue-500 dark:text-blue-400 ml-auto">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          {msg.content}
                        </div>
                      ) : (
                        <div
                          className={`max-w-[75%] rounded-lg px-4 py-2 ${
                            msg.sender === 'user'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-xs opacity-80">
                              {msg.sender === 'user' ? 'You' : 'Counterparty'}
                            </span>
                            <span className="text-xs opacity-60 ml-auto">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  {uploadedFileName && (
                    <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded px-3 py-1">
                      <FileText className="w-4 h-4" />
                      <span>{uploadedFileName}</span>
                      <button
                        onClick={() => setUploadedFileName(null)}
                        className="ml-auto text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Deal Tools */}
          <div className="space-y-6">
            {/* Document Exchange */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Document Exchange
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {}}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download NDA Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {}}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download Purchase Agreement Template
                  </Button>
                </div>

                <div>
                  <input
                    ref={docUploadRef}
                    type="file"
                    className="hidden"
                    onChange={handleDocUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => docUploadRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </div>

                {sharedDocuments.length > 0 && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Shared Documents
                    </p>
                    <ul className="space-y-2">
                      {sharedDocuments.map((doc) => (
                        <li
                          key={doc.id}
                          className="flex items-start gap-2 text-sm bg-gray-50 dark:bg-gray-900 rounded-lg p-2"
                        >
                          <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                              {doc.name}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {doc.hash}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {doc.uploadedBy} &middot;{' '}
                              {formatTime(doc.uploadedAt)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deal Memo Builder */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Deal Memo Builder
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Price per Share
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={pricePerShare}
                    onChange={(e) => {
                      setPricePerShare(e.target.value);
                      setDealMemoGenerated(false);
                      setTxHash(null);
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      setDealMemoGenerated(false);
                      setTxHash(null);
                    }}
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Deal Value</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {totalDealValue}
                  </p>
                </div>

                {!dealMemoGenerated ? (
                  <Button
                    className="w-full"
                    onClick={handleGenerateDealMemo}
                    disabled={!pricePerShare || !quantity}
                  >
                    Generate Deal Memo
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                        Terms Hash
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 font-mono break-all">
                        {termsHash}
                      </p>
                    </div>

                    {!signed ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={handleSign}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Sign Deal Memo
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-lg px-3 py-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>Signed by you</span>
                        </div>

                        {!txHash ? (
                          <Button
                            className="w-full"
                            onClick={handleRecordOnChain}
                            disabled={recordingOnChain}
                          >
                            {recordingOnChain ? (
                              <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Recording...
                              </>
                            ) : (
                              <>
                                <Hash className="w-4 h-4 mr-2" />
                                Record On-Chain
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                            <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400 mb-1">
                              Transaction Hash
                            </p>
                            <p
                              className="text-xs text-indigo-600 dark:text-indigo-400 font-mono break-all cursor-pointer hover:underline"
                              title="View on explorer"
                            >
                              {txHash}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compliance Notice */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Compliance Notice
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {PLATFORM_DISCLAIMER}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  This deal room expires after {expiryDays} days of inactivity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
