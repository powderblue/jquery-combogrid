#!/usr/bin/bash

# @todo Aim to not ignore
standard src/ | (! grep -v eqeqeq)
