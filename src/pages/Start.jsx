import FlipLink from "../components/FlipLink";

function Start() {
  return (
    <>
      <section className="grid min-h-screen w-full place-content-center gap-2 bg-gradient-to-br from-green-300 to-emerald-300 px-8 py-24 text-black">
        <FlipLink href="/teamSetup">Start</FlipLink>
        <FlipLink href="/fragen">Fragen</FlipLink>
        <FlipLink href="/settings">Settings</FlipLink>
      </section>
    </>
  );
}

export default Start;
