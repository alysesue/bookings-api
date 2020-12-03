# Parameter store
## Setting up
To setup access to the parameter store, please ensure that you have `mol-credentials` pulled locally.

### Install git-crypt
To be able to encrypt/decrypt the parameters, you would need to install `git-crypt` on your computer. Run `brew install git-crypt` to do so.

### Unlocking the parameters
After installing git-crypt, go to the root of this repository and run `git crypt unlock /path/to/key/location`

> If you have cloned the `mol-credentials` repository on the same directory level, the command would be `git-crypt unlock ../mol-credentials/git-crypt/mol-nonprod-gc-key`

> Bookingsg specific prod git-crypt key is found in `/mol/MOL_PROD_BOOKINGSG_GC_KEY` variable in parameter store. (it is in base 64 format - `mol-prod-bookingsg-gc-key`)
Get the key and convert it back from base 64
`cat /path/to/git-crypt-base-64-string-file | python -m base64 -d > keyfile`
and use git-crypt unlock to unlock prod.env file.
`git-crypt unlock path/to/prod/keyfile`

### Ensuring new parameter files are encrypted
If you have added a new file into the `secrets` folder, please run `git-crypt status -f && git-crypt status` and ensure that all the files in the secrets folder are encrypted.

This is to avoid pushing unecrypted secrets file into our remote repositories.

## Adding a new environment variable
You can run the script `./node_modules/mol-bamboo-scripts/scripts/generator/service-params-new-env.sh` and enter in the corresponding values to add in new environment variables to `ssm.tf` and the `.env` files.

Please be reminded that this fills in all the variables with the same value - you will need to update the values in each `.env` manually.

## Updating environment variables in .env
I'm sorry its all `manual` for now `ᕕ( ᐛ )ᕗ`
