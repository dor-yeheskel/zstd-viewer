param(
    [ValidateSet('help','init','build','package','clean','all')]
    [string]$Task = 'help'
)

function Help {
@'
USAGE: .\make.ps1 <task>

  init    - npm install
  build   - npm run compile
  package - npx vsce@latest package
  clean   - remove node_modules, out, *.vsix, package-lock.json
  all     - clean → init → build
'@
}

switch ($Task) {
  'init'    { npm install                                  }
  'build'   { npm run compile                              }
  'package' { npx vsce@latest package                      }
  'clean'   { Remove-Item -Recurse -Force node_modules,out,*.vsix,package-lock.json -ErrorAction SilentlyContinue }
  'all'     { & $PSCommandPath clean; & $PSCommandPath init; & $PSCommandPath build }
  default   { Help }
}

# Run:
# > Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# > .\make.ps1 <task>
