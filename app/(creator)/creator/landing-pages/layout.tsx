import type { ReactNode } from "react";

export const metadata = {
    title: "Community Home | Creator Dashboard",
    description:
        "Customize and manage your community home pages with the visual page builder.",
};

export default function LandingPagesLayout({
    children,
}: {
    children: ReactNode;
}) {
    return <>{children}</>;
}
