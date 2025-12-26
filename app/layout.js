import { Barlow } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
    variable: "--font-barlow",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
    title: "Chronic Fatigue Syndrome Awareness - Pledge Certificate",
    description: "Take the oath to restore energy and hope. Create your personalized pledge certificate for Chronic Fatigue Syndrome awareness and support.",
    keywords: ["Chronic Fatigue Syndrome", "CFS", "pledge certificate", "CoQ CFS", "fatigue awareness", "energy restoration", "UNS"],
    authors: [{ name: "Universal NutriScience" }],
    openGraph: {
        title: "Chronic Fatigue Syndrome Awareness - Pledge Certificate",
        description: "Take the oath to restore energy and hope. Join doctors committed to fighting chronic fatigue.",
        type: "website",
        images: [
            {
                url: "/intro_image.jpg",
                width: 1024,
                height: 768,
                alt: "Low Battery? High Responsibility! - CFS Awareness",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Chronic Fatigue Syndrome Awareness - Pledge Certificate",
        description: "Take the oath to restore energy and hope. Join doctors committed to fighting chronic fatigue.",
        images: ["/intro_image.jpg"],
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${barlow.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
