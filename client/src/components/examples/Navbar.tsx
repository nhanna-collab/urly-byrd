import Navbar from "../Navbar";

export default function NavbarExample() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Not logged in:</p>
        <Navbar
          isLoggedIn={false}
          onSignIn={() => console.log("Sign in clicked")}
        />
      </div>
      
      <div>
        <p className="text-sm text-muted-foreground mb-2">Logged in as merchant:</p>
        <Navbar
          isLoggedIn={true}
          isMerchant={true}
          onSignOut={() => console.log("Sign out clicked")}
        />
      </div>
    </div>
  );
}
