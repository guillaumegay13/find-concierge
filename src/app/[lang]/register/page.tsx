'use client'

import { useState, useEffect } from 'react'
import { getDictionary } from '../../dictionaries'
import { Dictionary } from '../../dictionaries'
import { useRouter } from 'next/navigation'

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
        getDictionary(lang)
            .then(setDict)
            .catch(error => {
                console.error('Error loading dictionary:', error);
                // You might want to set some default dictionary here or show an error message
            });
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