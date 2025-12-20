#!/bin/bash
# Simple bash wrapper to execute expect script
cd "$(dirname "$0")"
/usr/bin/expect infra/setup-email-working.exp

