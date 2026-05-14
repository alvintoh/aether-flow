FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

USER vscode
RUN curl -fsSL https://bun.sh/install | bash

ENV BUN_INSTALL="/home/vscode/.bun"
ENV PATH="${BUN_INSTALL}/bin:${PATH}"
