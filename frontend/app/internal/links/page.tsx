"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Copy, Check, Linkedin, Twitter, Facebook, Mail, Link2, ChevronRight } from "lucide-react"

// Custom icons for platforms not in lucide-react (or prefer standard icons)
const DiscordIcon = ({ className }: { className?: string }) => (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><title>Discord</title><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 00-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0276c1.9506-.6066 3.9413-1.5218 5.9921-3.0294a.077.077 0 00.0313-.0554c.5004-5.177-.5382-9.6739-3.5479-13.6631a.061.061 0 00-.0303-.028zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" /></svg>
)

const RedditIcon = ({ className }: { className?: string }) => (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><title>Reddit</title><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
)

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><title>WhatsApp</title><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
)

const LinkGenerator = ({
    utmSource,
    icon: Icon,
    label,
    colorClass,
    baseUrl
}: {
    utmSource: string,
    icon: any,
    label: string,
    colorClass?: string,
    baseUrl: string
}) => {
    const [copied, setCopied] = useState(false)

    const generateUrl = () => {
        try {
            const urlObj = new URL(baseUrl)
            urlObj.searchParams.set('utm_source', utmSource)
            urlObj.searchParams.set('utm_medium', 'social')
            return urlObj.toString()
        } catch {
            return baseUrl
        }
    }

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault()
        const url = generateUrl()

        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            // console.error('Failed to copy!', err)
        }
    }

    return (
        <div className="w-full flex items-center p-3 sm:p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm transition-all duration-200 group">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-100 group-hover:bg-white group-hover:border-gray-200 transition-colors`}>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass}`} />
            </div>

            <div className="flex-1 ml-4 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{label}</h3>
                <p className="text-xs text-gray-500 font-mono truncate">{generateUrl()}</p>
            </div>

            <button
                onClick={handleCopy}
                className="ml-3 p-2 text-gray-400 hover:text-white hover:bg-black rounded-lg transition-colors relative"
                title="Copy Link"
            >
                {copied ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                ) : (
                    <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
            </button>
        </div>
    )
}

export default function LinksPage() {
    const [baseUrl, setBaseUrl] = useState('https://pockett.io')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin)
        }
    }, [])

    return (
        <div className="flex flex-col space-y-8">
            {/* Breadcrumb & Title Section */}
            <div className="flex flex-col space-y-4">
                <nav className="flex items-center text-sm text-gray-500">
                    <Link href="/internal" className="flex items-center hover:text-gray-900 transition-colors">
                        <li className="flex items-center hover:text-gray-900 transition-colors">
                            <Link2 className="w-4 h-4" />
                        </li>
                    </Link>
                    <ChevronRight className="w-4 h-4 mx-2" />
                    <Link href="/internal" className="hover:text-gray-900 transition-colors">
                        Tools
                    </Link>
                    <ChevronRight className="w-4 h-4 mx-2" />
                    <span className="font-medium text-gray-900">Link Generator</span>
                </nav>

                <div className="flex flex-col">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Link Generator</h1>
                    <p className="text-gray-500 mt-1">Generate UTM-tracked links for social media sharing.</p>
                </div>
            </div>

            <div className="w-full max-w-2xl bg-gray-50/50 rounded-2xl border border-gray-200 p-6 sm:p-8">
                <div className="space-y-3">
                    <LinkGenerator
                        label="LinkedIn"
                        utmSource="linkedin"
                        icon={Linkedin}
                        colorClass="text-[#0077b5]"
                        baseUrl={baseUrl}
                    />
                    <LinkGenerator
                        label="WhatsApp"
                        utmSource="whatsapp"
                        icon={WhatsAppIcon}
                        colorClass="text-[#25D366]"
                        baseUrl={baseUrl}
                    />
                    <LinkGenerator
                        label="Email"
                        utmSource="email"
                        icon={Mail}
                        colorClass="text-gray-700"
                        baseUrl={baseUrl}
                    />
                    <LinkGenerator
                        label="Twitter / X"
                        utmSource="twitter"
                        icon={Twitter}
                        colorClass="text-black"
                        baseUrl={baseUrl}
                    />
                    <LinkGenerator
                        label="Reddit"
                        utmSource="reddit"
                        icon={RedditIcon}
                        colorClass="text-[#FF4500]"
                        baseUrl={baseUrl}
                    />
                    <LinkGenerator
                        label="Facebook Group"
                        utmSource="facebook"
                        icon={Facebook}
                        colorClass="text-[#1877F2]"
                        baseUrl={baseUrl}
                    />
                    <LinkGenerator
                        label="Discord"
                        utmSource="discord"
                        icon={DiscordIcon}
                        colorClass="text-[#5865F2]"
                        baseUrl={baseUrl}
                    />
                </div>
            </div>
        </div>
    )
}
