import { CharacterProvider } from "../context/CharacterContext";
import { BuilderLayout } from "../components/BuilderLayout";

export default function Home() {
  return (
    <CharacterProvider>
      <main className="min-h-screen bg-stone-200 p-4">
        <BuilderLayout />
      </main>
    </CharacterProvider>
  );
}
