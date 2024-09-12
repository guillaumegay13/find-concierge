'use client'

import { useState, useEffect } from 'react'
import { getDictionary } from '../../dictionaries'
import { Dictionary } from '../../dictionaries'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm({ onSuccess, onError, lang, dict }: { onSuccess: () => void, onError: (error: string) => void, lang: string, dict: Dictionary }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/${lang}/register/success`,
            },
        });

        if (error) {
            onError(error.message || dict.genericError);
        } else {
            onSuccess();
        }

        setIsProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            <button disabled={isProcessing || !stripe || !elements} className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300">
                {isProcessing ? dict.processing : dict.pay}
            </button>
        </form>
    );
}

export default function Register({ params: { lang } }: { params: { lang: string } }) {
    const [dict, setDict] = useState<Dictionary>({} as Dictionary)
    const [formData, setFormData] = useState({
        businessName: '',
        email: '',
        phone: '',
        website: '',
        services: '',
        location: '',
        description: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitMessage, setSubmitMessage] = useState('')
    const router = useRouter()

    useEffect(() => {
        getDictionary(lang).then(setDict)
    }, [lang])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target
        setFormData(prevData => ({ ...prevData, [name]: value }))
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsSubmitting(true)
        setSubmitMessage('')

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json()
            console.log('Response:', response.status, data);

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            setSubmitMessage(dict.registrationSuccess)
            router.push(`/${lang}/payment/${data.id}`)
        } catch (error) {
            console.error('Registration error:', error);
            setSubmitMessage(`${dict.registrationError}: ${error instanceof Error ? error.message : dict.genericError}`);
        }
        setIsSubmitting(false);
    }

    return (
        <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <h1 className="text-3xl font-bold mb-4">{dict.registerTitle}</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} placeholder={dict.businessNamePlaceholder} className="w-full p-2 border rounded" required />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder={dict.emailPlaceholder} className="w-full p-2 border rounded" required />
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder={dict.phonePlaceholder} className="w-full p-2 border rounded" required />
                <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder={dict.websitePlaceholder} className="w-full p-2 border rounded" />
                <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder={dict.locationPlaceholder} className="w-full p-2 border rounded" required />
                <textarea name="services" value={formData.services} onChange={handleChange} placeholder={dict.servicesPlaceholder} className="w-full p-2 border rounded" rows={4} required></textarea>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder={dict.descriptionPlaceholder} className="w-full p-2 border rounded" rows={4} required></textarea>
                <button type="submit" disabled={isSubmitting} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300">
                    {isSubmitting ? dict.loading : dict.registerButton}
                </button>
            </form>
            {submitMessage && <p className="mt-4">{submitMessage}</p>}
        </div>
    )
}