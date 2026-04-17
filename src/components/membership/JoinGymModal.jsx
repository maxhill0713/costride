import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dumbbell, Check, Trophy, Gift, TrendingUp, Loader2, CreditCard, Lock, Plus, ChevronLeft, X } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function JoinGymModal({ open, onClose, gym, currentUser }) {
  const [step, setStep] = useState(1); // 1: Plan, 2: Payment Method, 3: Payment Details, 4: Confirmation
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'card',
    card_number: '',
    card_brand: 'visa',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    billing_name: '',
    billing_address: '',
    billing_postcode: '',
    paypal_email: '',
    is_default: true
  });
  const queryClient = useQueryClient();

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['paymentMethods', currentUser?.id],
    queryFn: async () => {
      const methods = await base44.entities.PaymentMethod.list();
      return methods.filter(m => m.user_id === currentUser?.id);
    },
    enabled: !!currentUser && open
  });

  const savePaymentMethodMutation = useMutation({
    mutationFn: async (paymentData) => {
      return await base44.entities.PaymentMethod.create({
        ...paymentData,
        user_id: currentUser.id,
        user_email: currentUser.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    }
  });

  const processPaymentMutation = useMutation({
    mutationFn: async ({ paymentMethodId }) => {
      // Check membership limit before joining
      const currentMemberships = await base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' });
      if (currentMemberships.length >= 3) {
        throw new Error('You can only be a member of up to 3 gyms. Please leave a gym before joining a new one.');
      }

      // Create payment record
      const payment = await base44.entities.Payment.create({
        user_id: currentUser.id,
        gym_id: gym.id,
        gym_name: gym.name,
        amount: getPlanPrice(),
        currency: 'GBP',
        payment_method_id: paymentMethodId,
        payment_type: 'membership',
        status: 'completed',
        membership_type: selectedPlan
      });

      // Create membership
      const expiryDate = selectedPlan === 'monthly' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      await base44.entities.GymMembership.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        user_email: currentUser.email,
        gym_id: gym.id,
        gym_name: gym.name,
        status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        membership_type: selectedPlan
      });

      // Increment members count
      await base44.entities.Gym.update(gym.id, {
        members_count: (gym.members_count || 0) + 1
      });

      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymMembership'] });
      setStep(4);
    }
  });

  const getPlanPrice = () => {
    const basePrice = parseFloat(gym?.price || 50);
    if (selectedPlan === 'monthly') return basePrice;
    if (selectedPlan === 'annual') return Math.round(basePrice * 10);
    return basePrice;
  };

  const handlePaymentMethodSelection = (methodId) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleProceedToPayment = () => {
    if (selectedPaymentMethod && selectedPaymentMethod !== 'new') {
      processPaymentMutation.mutate({ paymentMethodId: selectedPaymentMethod });
    } else {
      setStep(3);
    }
  };

  const handleCompletePayment = async () => {
    const last4 = newPaymentMethod.card_number.slice(-4);
    const savedMethod = await savePaymentMethodMutation.mutateAsync({
      ...newPaymentMethod,
      card_last_four: last4,
      card_number: undefined,
      cvv: undefined
    });

    await processPaymentMutation.mutateAsync({ paymentMethodId: savedMethod.id });
  };

  const handleClose = () => {
    setStep(1);
    setSelectedPlan('monthly');
    setSelectedPaymentMethod(null);
    setNewPaymentMethod({
      type: 'card',
      card_number: '',
      card_brand: 'visa',
      expiry_month: '',
      expiry_year: '',
      cvv: '',
      billing_name: '',
      billing_address: '',
      billing_postcode: '',
      paypal_email: '',
      is_default: true
    });
    onClose();
  };

  if (!gym) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="joingym-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
        <motion.div
          key="joingym-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 1 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
            background: 'linear-gradient(160deg, #0c1128 0%, #060810 100%)',
            border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
          }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.2)' }} />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {step > 1 && step < 4 && (
                <button onClick={() => setStep(step - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 0 }}>
                  <ChevronLeft style={{ width: 20, height: 20 }} />
                </button>
              )}
              <Dumbbell style={{ width: 20, height: 20, color: '#3b82f6' }} />
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>
                {step === 4 ? 'Payment Successful!' : `Join ${gym.name}`}
              </h2>
            </div>
            <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 10, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}>
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>

          <div className="p-5">

        {/* Step 1: Plan Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Select Your Plan:</h3>
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
              <Card className={`p-4 cursor-pointer transition-all ${selectedPlan === 'monthly' ? 'border-2 border-blue-500 bg-blue-50' : 'border-2 border-gray-200'}`}
                onClick={() => setSelectedPlan('monthly')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <div>
                      <Label htmlFor="monthly" className="font-bold text-gray-900 cursor-pointer">Monthly</Label>
                      <p className="text-xs text-gray-500">Pay month by month</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-blue-600">£{gym?.price || 50}</div>
                    <div className="text-xs text-gray-500">/month</div>
                  </div>
                </div>
              </Card>

              <Card className={`p-4 cursor-pointer transition-all ${selectedPlan === 'annual' ? 'border-2 border-blue-500 bg-blue-50' : 'border-2 border-gray-200'}`}
                onClick={() => setSelectedPlan('annual')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="annual" id="annual" />
                    <div>
                      <Label htmlFor="annual" className="font-bold text-gray-900 cursor-pointer">Annual</Label>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">Save 2 months!</p>
                        <Badge className="bg-green-500 text-white">Best Value</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-blue-600">£{Math.round((gym?.price || 50) * 10)}</div>
                    <div className="text-xs text-gray-500">/year</div>
                  </div>
                </div>
              </Card>
            </RadioGroup>

            <div className="space-y-3 pt-4">
              <h3 className="font-bold text-gray-900">What's Included:</h3>
              {[
                { icon: Dumbbell, text: 'Full gym access' },
                { icon: TrendingUp, text: '24/7 availability' },
                { icon: Trophy, text: 'Compete on leaderboards' },
                { icon: Gift, text: 'Earn exclusive rewards' },
                { icon: Check, text: 'Join challenges & events' },
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-gray-900 font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold h-12 rounded-2xl"
            >
              Continue to Payment
            </Button>
          </div>
        )}

        {/* Step 2: Payment Method Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Select Payment Method:</h3>
            
            {/* Quick Payment Options */}
            <div className="space-y-2">
              <Button
                onClick={() => {
                  processPaymentMutation.mutate({ paymentMethodId: 'apple_pay' });
                }}
                className="w-full bg-black hover:bg-gray-900 text-white font-bold h-12 rounded-2xl flex items-center justify-center gap-2"
                disabled={processPaymentMutation.isPending}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Pay
              </Button>

              <Button
                onClick={() => {
                  processPaymentMutation.mutate({ paymentMethodId: 'paypal' });
                }}
                className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold h-12 rounded-2xl flex items-center justify-center gap-2"
                disabled={processPaymentMutation.isPending}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 01-.794.679H7.72a.483.483 0 01-.477-.558L9.22 7.771a.965.965 0 01.952-.812h4.42c1.659 0 2.988.37 3.944 1.162.36.3.64.646.84 1.018.146.27.261.556.346.858.007.026.014.052.02.078l.024.097.013.057c.028.13.05.264.069.401l.014.104z"/>
                  <path d="M10.736 8.421l.012-.006.02-.008.023-.01c.023-.009.046-.018.07-.026l.027-.01a.798.798 0 01.095-.025l.028-.007.085-.015.03-.004c.28-.038.577-.058.887-.058h4.42c1.183 0 2.15.197 2.892.594l.05.027c-.15 1.72-1.031 3.265-2.504 4.16-.848.516-1.863.79-2.986.79h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 01-.794.679H7.72a.483.483 0 01-.477-.558l2.977-18.338a.965.965 0 01.952-.812h4.42c.313 0 .607.02.887.058.032.004.063.01.095.015l.027.007c.033.009.064.017.095.025l.028.01a.72.72 0 01.07.026l.023.01.02.008.012.006z" opacity=".7"/>
                </svg>
                PayPal
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or pay with card</span>
              </div>
            </div>
            
            <RadioGroup value={selectedPaymentMethod} onValueChange={handlePaymentMethodSelection}>
              {paymentMethods.map((method) => (
                <Card key={method.id} className={`p-4 cursor-pointer transition-all ${selectedPaymentMethod === method.id ? 'border-2 border-blue-500 bg-blue-50' : 'border-2 border-gray-200'}`}
                  onClick={() => handlePaymentMethodSelection(method.id)}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <Label htmlFor={method.id} className="font-bold text-gray-900 cursor-pointer capitalize">
                        {method.card_brand} •••• {method.card_last_four}
                      </Label>
                      <p className="text-xs text-gray-500">Expires {method.expiry_month}/{method.expiry_year}</p>
                    </div>
                    {method.is_default && (
                      <Badge className="bg-green-100 text-green-700">Default</Badge>
                    )}
                  </div>
                </Card>
              ))}

              <Card className={`p-4 cursor-pointer transition-all ${selectedPaymentMethod === 'new' ? 'border-2 border-blue-500 bg-blue-50' : 'border-2 border-gray-200'}`}
                onClick={() => handlePaymentMethodSelection('new')}>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="new" id="new" />
                  <Plus className="w-5 h-5 text-blue-600" />
                  <Label htmlFor="new" className="font-bold text-blue-600 cursor-pointer">
                    Add New Payment Method
                  </Label>
                </div>
              </Card>
            </RadioGroup>

            <Card className="p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-black text-blue-600">£{getPlanPrice()}</span>
              </div>
            </Card>

            <Button
              onClick={handleProceedToPayment}
              disabled={!selectedPaymentMethod || processPaymentMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold h-12 rounded-2xl"
            >
              {processPaymentMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Pay £{getPlanPrice()}
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Secure payment processing
            </p>
          </div>
        )}

        {/* Step 3: New Payment Details */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Payment Details:</h3>
            
            <div className="space-y-3">
              <div>
                <Label>Payment Type</Label>
                <Select value={newPaymentMethod.type} onValueChange={(value) => setNewPaymentMethod({...newPaymentMethod, type: value})}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newPaymentMethod.type === 'card' && (
                <>
                  <div>
                    <Label>Card Number</Label>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      value={newPaymentMethod.card_number}
                      onChange={(e) => setNewPaymentMethod({...newPaymentMethod, card_number: e.target.value.replace(/\s/g, '')})}
                      className="rounded-2xl"
                      maxLength={16}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Month</Label>
                      <Input
                        placeholder="MM"
                        value={newPaymentMethod.expiry_month}
                        onChange={(e) => setNewPaymentMethod({...newPaymentMethod, expiry_month: e.target.value})}
                        className="rounded-2xl"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <Label>Year</Label>
                      <Input
                        placeholder="YYYY"
                        value={newPaymentMethod.expiry_year}
                        onChange={(e) => setNewPaymentMethod({...newPaymentMethod, expiry_year: e.target.value})}
                        className="rounded-2xl"
                        maxLength={4}
                      />
                    </div>
                    <div>
                      <Label>CVV</Label>
                      <Input
                        placeholder="123"
                        type="password"
                        value={newPaymentMethod.cvv}
                        onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cvv: e.target.value})}
                        className="rounded-2xl"
                        maxLength={3}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Card Brand</Label>
                    <Select value={newPaymentMethod.card_brand} onValueChange={(value) => setNewPaymentMethod({...newPaymentMethod, card_brand: value})}>
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visa">Visa</SelectItem>
                        <SelectItem value="mastercard">Mastercard</SelectItem>
                        <SelectItem value="amex">American Express</SelectItem>
                        <SelectItem value="discover">Discover</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {newPaymentMethod.type === 'paypal' && (
                <div>
                  <Label>PayPal Email</Label>
                  <Input
                    placeholder="your@email.com"
                    type="email"
                    value={newPaymentMethod.paypal_email}
                    onChange={(e) => setNewPaymentMethod({...newPaymentMethod, paypal_email: e.target.value})}
                    className="rounded-2xl"
                  />
                </div>
              )}

              <div>
                <Label>Billing Name</Label>
                <Input
                  placeholder="Full name on card"
                  value={newPaymentMethod.billing_name}
                  onChange={(e) => setNewPaymentMethod({...newPaymentMethod, billing_name: e.target.value})}
                  className="rounded-2xl"
                />
              </div>

              <div>
                <Label>Billing Address</Label>
                <Input
                  placeholder="123 Main Street"
                  value={newPaymentMethod.billing_address}
                  onChange={(e) => setNewPaymentMethod({...newPaymentMethod, billing_address: e.target.value})}
                  className="rounded-2xl"
                />
              </div>

              <div>
                <Label>Postcode</Label>
                <Input
                  placeholder="SW1A 1AA"
                  value={newPaymentMethod.billing_postcode}
                  onChange={(e) => setNewPaymentMethod({...newPaymentMethod, billing_postcode: e.target.value})}
                  className="rounded-2xl"
                />
              </div>
            </div>

            <Card className="p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-black text-blue-600">£{getPlanPrice()}</span>
              </div>
            </Card>

            <Button
              onClick={handleCompletePayment}
              disabled={processPaymentMutation.isPending}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold h-12 rounded-2xl"
            >
              {processPaymentMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Complete Payment
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Your payment details are secure and encrypted
            </p>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-4 text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Welcome to {gym.name}!</h3>
            <p className="text-gray-600">Your membership is now active. Start your fitness journey today!</p>
            
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-bold text-gray-900 capitalize">{selectedPlan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-bold text-gray-900">£{getPlanPrice()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className="bg-green-500 text-white">Active</Badge>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold h-12 rounded-2xl"
            >
              Start Working Out!
            </Button>
          </div>
        )}
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}