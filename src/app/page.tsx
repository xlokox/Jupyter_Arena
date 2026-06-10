import { Header } from "@/components/header";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1" />
    </div>
  );
}
