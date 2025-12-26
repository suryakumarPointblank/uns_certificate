import { Barlow } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
    variable: "--font-barlow",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
    title: "World Arthritis Week 2025 - Pledge Certificate",
    description: "Create your personalized World Arthritis Week 2025 pledge certificate. Commit to joint health awareness, early diagnosis, and comprehensive management of osteoarthritis.",
    keywords: ["World Arthritis Week", "2025", "pledge certificate", "joint health", "osteoarthritis", "arthritis awareness"],
    authors: [{ name: "DocPromise" }],
    openGraph: {
        title: "World Arthritis Week 2025 - Pledge Certificate",
        description: "Create your personalized pledge certificate for joint preservation and arthritis awareness.",
        type: "website",
        images: [
            {
                url: "/certificate.jpg",
                width: 4267,
                height: 3200,
                alt: "World Arthritis Week 2025 Pledge Certificate",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "World Arthritis Week 2025 - Pledge Certificate",
        description: "Create your personalized pledge certificate for joint preservation and arthritis awareness.",
        images: ["/certificate.jpg"],
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
