#!/bin/bash
set -e
echo "Installing DFX SDK..."
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
echo "DFX installed successfully"
echo "Current directory: $(pwd)"
