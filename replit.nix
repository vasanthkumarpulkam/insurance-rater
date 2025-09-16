{ pkgs }: {
  deps = [
    pkgs.nodejs_22
    pkgs.corepack
    pkgs.python312
    pkgs.python312Packages.pip
  ];
}
