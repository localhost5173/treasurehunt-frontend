{
  description = "Svelte 5 development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = {
    self,
    nixpkgs,
  }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in {
    devShells.${system}.default = pkgs.mkShell {
      buildInputs = [
        pkgs.nodejs
        pkgs.pnpm
      ];

      shellHook = ''
        echo "Welcome to Svelte 5 dev shell!"
        echo "Node version: $(node -v)"
        echo "Use npm or pnpm to install packages like svelte@5"
      '';
    };
  };
}