# Stack DID method spec

Blockstack V2 DID Method Specification

# Abstract

Blockstack is a network for decentralized applications where users own their identities and data.  Blockstack utilizes a public blockchain to implement a decentralized [naming layer](https://docs.blockstack.org/core/naming/introduction.html), which binds a user's human-readable username to their current public key and a pointer to their data storage buckets.  The naming layer ensures that names are globally unique, that names can be arbitrary human-meaningful strings, and that names are owned and controlled by cryptographic key pairs such that only the owner of the private key can update the name's associated state. This document describes a DID method built around the BNS naming layer. It describes how a resolvable DID can be derived given a BNS name, as well as how these DIDs can be updated, revoked, and resolved.

# Status of This Document

This document is not a W3C Standard nor is it on the W3C Standards Track. This
is a draft document and may be updated, replaced or obsoleted by other documents
at any time. It is inappropriate to cite this document as other than work in progress.

Comments regarding this document are welcome. Please file issues directly on [Github](https://github.com/jolocom/Stacks-DID-Resolver).

# 1. System Overview

The Blockstack DID method is specified as part of its [decentralized naming system](https://docs.stacks.co/build-apps/references/bns) (*BNS*).
Each Blockstack name has one corresponding DIDs, and each Blockstack DID
corresponds to exactly one name -- even if the name was revoked by its owner or
expired.

Blockstack is unique among decentralized identity systems in that it is *not*
anchored to a specific blockchain or DLT implementation.  The system is designed
from the ground up to be portable, and has already been live-migrated from the
Namecoin blockchain to the Bitcoin blockchain.  The operational ethos of
Blockstack is to leverage the must secure blockchain at all times -- that is,
the one that is considered hardest to attack.

The Blockstack naming system and the derived DIDs transcend the underlying blockchain, and
will continue to resolve to DID documents even if the system migrates to a new blockchain in the future.

## 1.1 DID Lifecycle

Understanding how Blockstack DIDs operate requires understanding how Blockstack names operate. Fundamentally, a Blockstack DID is defined as a pointer to a *BNS name registered by an address*. The lifecycle of a Blockstack DID is therefore tied to the lifecycle of it's underlying BNS name.

The Blockstack naming system differentiates between two types of names (and by extension, two types of resulting DIDs), *on-chain* and *off-chain* (elaborated on in the following subsections). Both on-chain and off-chain names (as well as the resulting DIDs) can be resolved to a set of singing keys, as well as additional metadata, using the BNS smart contract, and the Gaia storage network, as outlined in section 3. 

## 1.2 On-chain DIDs

*On-chain DIDs* are based on [BNS names](https://docs.stacks.co/build-apps/references/bns#organization-of-bns), the records for which are stored and managed on the blockchain. The ownership / state of these names is managed by the BNS smart contract, and can be read / updated by interacting with the deployed smart contract directly (e.g. by calling the [`name-update`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L657) or [`name-resolve`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L928) functions).

The BNS contract associates a number of properties with each registered name, such as the name's current owner (i.e. a [Stacks address](https://docs.stacks.co/understand-stacks/accounts)), the registration and expiry dates, as well the corresponding DNS zone file (created and broadcasted by the name owner) which can be used to retrieve further information associated with the name (for further details please refer to the [BNS documentation](https://docs.stacks.co/build-apps/references/bns)). The associated DNS zone file is expected to include a `URI` resource record, pointing to a signed [JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519) (JWT). The JWT is also expected to include a public key which hashes to the address of the current owner, and can be used to verify the associated signature.

A resolvable Stacks v2 DID can be derived for any on-chain name by concatenating two pieces of information:

- The address of the name owner, e.g. `SP6G7N19FKNW24XH5JQ5P5WR1DN10QWMKMF1WMB3`
- The identifier of the Stacks transaction which registered the on-chain name,
e.g. `d27cb8d9cd4a9f21b1582c5c89a0d303aa613261ad41b729b48bf714f9cd1a02`

The resulting DID -
`did:stack:v2:SP6G7N19FKNW24XH5JQ5P5WR1DN10QWMKMF1WMB3-d27cb8d9cd4a9f21b1582c5c89a0d303aa613261ad41b729b48bf714f9cd1a02`
contains enough information to map it to one corresponding BNS name. The BNS contract can be used to retrieve and verify the public keys associated with the BNS name (and by extension the DID) during the resolution process (as outlined in section 3.2).

## 1.3 Off-chain DIDs

Off-chain DIDs are based on [BNS subdomains](https://docs.stacks.co/build-apps/references/bns#subdomains), the records for which are stored entirely off-chain, but are collectively anchored to the blockchain. The ownership and state for these names lives within the P2P network data.

Like their on-chain counterparts, subdomains are globally unique, strongly owned, and human-readable. BNS gives them their own name state and public keys. 

Unlike on-chain names, subdomains can be created and managed cheaply, because they are broadcast to the BNS network in batches (as described in section 3.1).

An off-chain DID is similarly structured to an on-chain DID. Like on-chain names, each off-chain name is owned by an address, and is associated with a corresponding DNS zone file. A resolvable Stacks V2 DID can be derived for any existing off-chain name by concatenating two pieces of
information:

- The address of the subdomain owner, e.g. `SJB53GD600EMEM74DFMA0B61JN8D8C4VE4M8NJRP`
- The identifier of the Stacks transaction (created by the on-chain name owner)
which anchored the relevant batch of updates on the Stacks blockchain, e.g. `ca2c2398b017d6d4c0e3e58b3807a648ebd5e15e1e1ce98649bab7bda044cf37`

Please note that the Stacks address of the subdomain owner is encoded using a different version byte (and subsequently starts with a different prefix) compared to an on-chain address (further elaborated on in sections 2.1 and 2.2).

The resulting did -
`did:stack:v2:SJB53GD600EMEM74DFMA0B61JN8D8C4VE4M8NJRP-ca2c2398b017d6d4c0e3e58b3807a648ebd5e15e1e1ce98649bab7bda044cf37`
contains enough information to map it to one corresponding off-chain BNS name during the resolution process (as described in section 3.3). The BNS contract, in combination with the Gaia storage network, can be used to retrieve and verify the public keys associated with the off-chain name (and by extension the DID) during the resolution process (as outlined in section 3.2).

# 2. Blockstack DID Method

The namestring that shall identify this DID method is: `stack:v2`

A DID that uses this method *MUST* begin with the following literal prefix:
`did:stack:v2`.  The remainder of the DID is its method-specific identifier.

## 2.1 Method-Specific Identifier

The method-specific identifier of the Blockstack DID encodes two pieces of
information: a Stacks address, and a Stacks transaction identifier.

The **address** shall be a [c32check](https://github.com/blockstack/c32check#c32check) encoding of a version byte concatenated
with the RIPEMD160 hash of a SHA256 hash of a DER-encoded secp256k1 public key.
For example, in this Javascript snippet:

``` javascript
const crypto = require('crypto')
const RIPEMD160 = require('ripemd160')
const c32check = require('c32check')

const pubkey = Buffer.from(
  '042bc8aa4eb54d779c1fb8a2d5022aec8ed7fc2cc34d57356d9e1c417ce416773f45b0299ea7be347d14c69c403d9a03c8ec0ccf47533b4bee8cd002e5de81f945',
  'hex'
)

const sha256Pubkey = crypto.createHash('sha256')
  .update(pubkey)
  .digest('hex');
// '18328b13b4df87cbcd190c083ef1d74487fc1383792f208f52c596b4588fb665'

const ripemd160Sha256Pubkey = new RIPEMD160()
  .update(Buffer.from(sha256Pubkey, 'hex'))
  .digest('hex')
// '1651c1a6001d4750e46be8a02cc19550d4309b71'

const versionByte = 22
const address = c32check.c32address(versionByte, ripemd160Sha256Pubkey)
// SPB53GD600EMEM74DFMA0B61JN8D8C4VE7D2ZSJ9


```

The **transaction identifier** shall reference a valid Stacks blockchain transaction. As elaborated on in later sections, the referenced transaction is expected to encode a [`name-register`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L609), [`name-update`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L657), or [`name-import`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L438) call to the BNS contract.

## 2.2 Address Encoding

The address's version byte encodes whether or not a DID corresponds to an
on-chain name transaction or an off-chain name transaction, and whether or not
it corresponds to a mainnet or testnet address.  The version bytes for each
configuration shall be as follows:

- On-chain names on mainnet: `0x16` (decimal value 22)
- On-chain names on testnet: `0x1a` (decimal value 26)
- Off-chain names on mainnet: `0x11` (decimal value 17)
- Off-chain names on testnet: `0x12` (decimal value 18)

For example, the RIPEMD160 hash `1651c1a6001d4750e46be8a02cc19550d4309b71` derived in the previous snippet would encode to the following c32Check strings depending on the address type:

- On-chain mainnet: `SPB53GD600EMEM74DFMA0B61JN8D8C4VE7D2ZSJ9`
- On-chain testnet: `STB53GD600EMEM74DFMA0B61JN8D8C4VE5477MXR`
- Off-chain mainnet: `SHB53GD600EMEM74DFMA0B61JN8D8C4VE6DHF2QF`
- Off-chain testnet: `SJB53GD600EMEM74DFMA0B61JN8D8C4VE4M8NJRP`

The version bytes for the various address types can be [found here](https://github.com/jolocom/stacks-did-resolver/blob/main/src/constants.ts#L33).

# 3. Blockstack DID Operations

## 3.1 Creating a Blockstack DID

As mentioned in sections 1.2 and 1.3, a resolvable `stack:v2` DID can be derived
given a valid BNS name (off-chain or on-chain).  The process of creating a
a DID is therefore reduced to registering the underlying BNS name.

The following subsections will describe how on-chain and off-chain
BNS names can be registered.

### 3.1.1 On-chain names

Instantiating an on-chain name requires two calls to the BNS smart contract:

1. First a call to the [`name-preorder`](notion://www.notion.so/jolocom/%3Chttps://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L581%3E) function needs to be made. This transaction commits to a salted hashed name and burns the required registration fee (depends on the name / namespace).
2. Once the preorder transaction has been processed and accepted by the network,
a [`name-register`](notion://www.notion.so/jolocom/.%3Chttps://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L609/%3E) function call can be made to finalize the registration process. This transaction reveals the salt and the registered name to the network. If the operation
succeeds, the BNS contract state will be updated to include a new entry,
mapping the newly registered name to it's owner's address, and to it's current zone file.

Once the name has been registered, a resolvable Stacks v2 DID can be derived by combining the Stacks address of the name owner (the sender of the [`name-register`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L609) transaction), and the identifier of the [`name-register`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L609) transaction which registered the name.

Blockstack supplies a [reference library](https://github.com/blockstack/stacks.js/tree/master/packages/bns) which allows developers to easily interact with the BNS smart contract (e.g. for the purpose of registering an on-chain name). For further usage examples, see the helper functions used in the [DID resolver](https://github.com/jolocom/stacks-did-resolver/tree/feat/update-method-spec/src/registrar) implementation. 

### 3.1.2 Registering off-chain names

Unlike an on-chain name, a subdomain owner needs an on-chain name owner's help
to broadcast their subdomain operations. In particular, a subdomain-creation
transaction can only be processed by the owner of the on-chain name that shares
its suffix. For example, only the owner of `example.id` can broadcast
subdomain-creation transactions for subdomain names ending in `.example.id`.
This is because the zone file related to / describing the subdomain
(`demo.example.id`) is included / nested in the zone file of the name owner
(`example.id`).

To register an off-chain name, the user must submit a request to the
corresponding off-chain registrar. Anyone with an on-chain name can operate such
a registrar.  A reference registrar implementation can be found [here](https://github.com/blockstack/subdomain-registrar).

To register an off-chain DID, the user must submit a JSON body as a HTTP POST
request to the registrar's registration endpoint with the following format:

```
{
   "zonefile": "<zonefile encoding the location of the DDO>",
   "name": "<off-chain name, excluding the on-chain suffix>",
   "owner_address": "<b58check-encoded address that will own the name, with version byte \\x00>",
}

```

For example, to register the name `demo` on a registrar for `example.id`:

```
$ curl -X POST -H 'Authorization: bearer API-KEY-IF-USED' -H 'Content-Type: application/json' \\
> --data '{"zonefile": "$ORIGIN demo\\n$TTL 3600\\n_https._tcp URI 10 1 \\"<https://gaia.blockstack.org/hub/1HgW81v6MxGD76UwNbHXBi6Zre2fK8TwNi/profile.json\\"\\n">, \\
>          "name": "demo", \\
>          "owner_address": "1HgW81v6MxGD76UwNbHXBi6Zre2fK8TwNi"}' \\
> <http://localhost:3000/register/>

```

The `zonefile` field must be a well-formed DNS zone file, and must have the
following properties (the same restrictions apply to zone files for on-chain names as well):

- It must have its `$ORIGIN` field set to the off-chain name.
- It must have at least one `URI` resource record that encodes an HTTP or HTTPS
URL. Note that its name must be either `_http._tcp` or `_https._tcp`, per the
`URI` record specification.
- The HTTP or HTTPS URL must resolve to a JSON Web token signed by a secp256k1
public key that hashes to the `owner_address` field (as briefly described in section 1.2).

The registrar will collect multiple such requests from subdomain owners before broadcasting a new batch of updates. It can do this by composing a new zone file which includes all received subdomain operations, replicating it, and setting a new zone file hash with a [`name-update`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L657) transaction. This, in turn, replicates all subdomain operations it contains, and anchors the set of subdomain operations to an on-chain transaction.

The BNS node's consensus rules ensure that only valid subdomain operations from valid [`name-register`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L609), [`name-update`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L657) or [`name-import`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L438) transactions will ever be stored.

As mentioned in section 1.3, a resolvable off-chain Stacks v2 DID can be derived for any registered subdomain by combining the Stacks address of the subdomain owner, and the identifier of the Stacks transaction which anchored the subdomain creation operation.

Blockstack provides a reference implementation of a [subdomain registrar](https://github.com/blockstack/subdomain-registrar) service which can be easily operated by any on-chain BNS name owner to allow for the registration of subdomains. The aforementioned [set of helper functions](https://github.com/jolocom/stacks-did-resolver/blob/feat/update-method-spec/src/registrar/subdomains.ts) used to test the DID resolver implementation include some examples of subdomain creation operations as well. 

## 3.2 Resolving a Blockstack DID

Resolving Stacks DIDs happens with the aid of the aforementioned BNS smart
contract and the Gaia storage network. The resolution process can be generalized to the following main steps:

1. First, the data encoded in the Stacks v2 DID NSI is used to map it to it's corresponding
underlying BNS name. As mentioned in the previous sections, a Stacks v2 DID
can map to an on-chain or off-chain name.
2. Ensure that no name revocation operations were broadcasted for the underlying
BNS name since the creation of the DID. In case the name was revoked, the DID
is considered deactivated, and the resolution process will fail with the
corresponding error.
3. Parse and verify any ownership change operations (i.e. [`name-transfer`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L679)
transactions for on-chain names, or [`name-update`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L679) operations for off-chain names) broadcasted for the underlying BNS name since the creation of the DID. These operations can be used to rotate the public key(s) associated with a BNS name (and by extension the associated DID). The latest valid set of keys will be returned once this step completes.

The individual steps are described in more detail in the following subsections.

### 3.2.1 Mapping a DID to a BNS name

First, the DID's NSI (defined in section 2.1) is parsed, and the encoded Stacks address, and Stacks transaction identifier are extracted. The Stacks transaction identifier is used to query a Stacks blockchain client for the full transaction data (e.g. by using the corresponding [HTTP API endpoint](https://stacks-node-api.mainnet.stacks.co/extended/v1/tx/0xdb05bd4e09fb29b6c91087aa9af0edeeb9f9f588a74ac64529bee9659c41871b)).

The retrieved transaction object is expected include a contract call to one of the following BNS smart contract functions:

- `name-register` - used to register a on-chain or off-chain name
(depending on the contents of the associated zone file).
- `name-import` - used to register a on-chain or off-chain name
(depending on the contents of the associated zone file).
- `name-update` - can be used to register a off-chain name.

All three transactions listed above are expected to include the following
function call arguments:

- `name` - the BNS name being registered (e.g. "example").
- `namespace` - the namespace to which the name belongs (e.g. "id").
- `zonefile-hash` - the hash of the DNS zone file associated with the name.

The Gaia storage network can be used to retrieve the zone
file using the `zonefile-hash` extracted from the transaction. The retrieved `zonefile` is
expected to contain a `$ORIGIN` directive, matching the `name` and `namespace`
values extracted from the transaction object.

The zone file may also include one or more `TXT` resource records which encode further zone
files associated with subdomains registered under this BNS `name`. Each `TXT` resource
record is expected to encode a zone file for the subdomain, as well as the
address of the subdomain owner (as documented [here](https://docs.stacks.co/build-apps/references/bns#subdomains)).

As described in section 2.2, a Stacks v2 DID encodes a Stacks address, which subsequently includes a version byte denoting whether the DID is associated with an on-chain or off-chain BNS name. If the DID is associated with an on-chain name, the DID is mapped to the `name` and `namespace` encoded in the transaction object (as well as the `$ORIGIN` directive), and the `TXT` records (if present) are ignored.

If the DID is associated with an off-chain name, the corresponding zone file is expected to be encoded in one the included `TXT` resource records. The relevant entry is expected to list the `address` (extracted from the DID NSI) as the *owner*. In case the entry is found, the DID is mapped to the `subdomain` (retrieved from the zone file), `name` and `namespace` (extracted from the registration transaction), otherwise resolution fails with the appropriate error.

Before the mapped BNS name can be returned, the signed JSON Web Token referenced in the relevant zone file needs to be retrieved, and the included public key used to verify the associated signature. If the signature verifies correctly, and the included public key hashes to the `address` encoded in the DID's NSI, this step completes successfully, and the corresponding BNS name is returned, otherwise resolution fails with an error.

### 3.2.2 Ensuring the DID is not deactivated

As outlined in section 3.4, a Stacks v2 DID can be deactivated by revoking the underlying BNS name. Deactivated DIDs should no longer resolve to DID Documents / public keys (also revoked BNS names can not be reassigned or updated in the future, rendering the DID unusable). 

For on-chain names, the revocation status is tracked by the BNS smart contract (as can [be seen here](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L92)), while for off-chain names, revocation is expressed by transferring the name to a "nothing-up-my-sleeve" address (as elaborated on in section 3.4). 

Once the DID has been mapped to the underlying BNS name and the latest name state is retrieved, depending on the type of DID being resolved (on-chain or off-chain), the appropriate revocation check is performed. In case the name has been revoked, the resolution process fails with the appropriate error, otherwise the process continues.

### 3.2.3 Resolving the DID to the latest set of keys

The last step in the resolution process is mapping the BNS name (and by
extension DID) to it's latest owner and set of public keys. As described in
section 3.3, the keys associated with a DID can be rotated after the DID was created (e.g. by issuing a [`name-transfer`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L679) operation designating a new owner
in the case of an on-chain BNS name). 

Similarly to the process described in subsection 3.2.3, the latest state associated with the relevant BNS name (either on-chain or off-chain) is retrieved, and, in case the owner of the underlying name has changed since the DID's creation,  the new public key needs to be retrieved and verified.

The process for retrieving the key is similar to the one described in section
3.2.1, namely it consists of fetching the latest zone file for the BNS name,
finding the relevant `URI` resource record, fetching the referenced signed JSON
Web Token, verifying the signature and the included public key(s), and finally
returning the latest valid public key(s) for the name.

In case no ownership transfer operations were issued for the DID / underlying BNS name, we
continue to step 3.2.4 with the original public key(s) retrieved in step 3.2.1.

### 3.2.4 Generating a DID Document for a Stacks v2 DID

As described in the previous subsections, the resolution process consists of mapping a DID to a
set of active signing keys via the underlying BNS name. Once the steps outlined
above have been completed, the resolved public key(s), alongside the DID, can be used to
generate a well-formed DID Document "on the fly" and return it to the client.

## 3.3 Updating a Blockstack DID

In case the public keys associated with a BNS name (and by extension a DID) need to be rotated, an appropriate ownership transfer operation can be assembled and broadcasted by the current name owner. The process differs depending on whether an on-chain or off-chain name is being updated.

### 3.3.1 Updating an on-chain Blockstack DID

A user can rotate the keys associated with their on-chain BNS name / DID by
transferring the ownership of the name to a different address. In order to
accomplish this for an on-chain name, the user must broadcast a `name-transfer`
transaction, listing the desired address as the new owner.  Once the transaction is
confirmed by the Stacks network, the public keys associated with a BNS name (and by extension with the on-chain DID) key will be updated.

Blockstack supplies a [reference library](https://github.com/blockstack/stacks.js/tree/master/packages/bns) enabling developers to easily interact with the BNS contract in order to transfer a BNS name. For examples on how to use the library to update a on-chain
Stacks v2 DIDs, consult the [following test helpers](https://github.com/jolocom/Stacks-DID-Resolver/blob/main/src/registrar/index.ts#L171) used by the DID resolver implementation.

### 3.3.2 Updating an off-chain DID

If the DID corresponds to an off-chain name, then the user must request that the registrar that instantiated the name broadcasts an off-chain name transfer operation.  To do so, the user must submit a string with the following format to the registrar:

```
${name} TXT "owner=${new_address}" "seqn=${update_counter}" "parts=${length_of_zonefile_base64}" "zf0=${base64_part_0}" "zf1=${base64_part_1}" ... "sig=${base64_signature}"

```

The string is a well-formed DNS TXT record with the following fields:

- The `${name}` field is the subdomain name without the on-chain suffix (e.g.
`demo` in `demo.example.id`.
- The `${new_address}` field is the new owner address of the subdomain name.
- The `${update_counter}` field is a non-negative integer equal to the number of
subdomain name operations that have occurred so far. It starts with 0 when
the name is created, and must increment each time the name owner issues an
off-chain name operation.
- The `${length_of_zonefile_base64}` field is equal to the length of the
base64-encoded zone file for the off-chain name.
- The fields `zf0`, `zf1`, `zf2`, etc. and their corresponding variables
`${base64_part_0}`, `${base64_part_1}`, `${base64_part_2}`, etc. correspond to
256-byte segments of the base64-encoded zone file. They must occur in a
sequence of `zf${n}` where `${n}` starts at 0 and increments by 1 until all
segments of the zone file are represented.
- The `${base64_signature}` field is a secp256k1 signature over the resulting
string, up to the `sig=` field, and base64-encoded. The signature must come
from the secp256k1 private key that currently owns the name.

Thus to generate this TXT record for their DID, the user would do the following:

1. Base64-encode the off-chain DID's zone file.
2. Break the base64-encoded zone file into 256-byte segments.
3. Assemble the TXT record from the name, new address, update counter, and zone
file segments.
4. Sign the resulting string with the DID's current private key.
5. Generate and append the `sig=${base64_signature}` field to the TXT record.

Sample code to generate these TXT records can be found in the [Blockstack Core
reference implementation](https://github.com/blockstack/blockstack-core), under the `blockstack.lib.subdomains` package.  For example, the Python 2 program here generates such a TXT record:

```
import blockstack

offchain_name = 'bar'
onchain_name = 'foo.test'
new_address = '1Jq3x8BAYz9Xy9AMfur5PXkDsWtmBBsNnC'
seqn = 1
privk = 'da1182302fee950e64241a4103646992b1bed7f6c4ced858282e493d57df33a501'
full_name = '{}.{}'.format(offchain_name, onchain_name)
zonefile = "$ORIGIN {}\\n$TTL 3600\\n_http._tcp\\tIN\\tURI\\t10\\t1\\t\\"<https://gaia.blockstack.org/hub/{}/profile.json\\"\\n\\n".format>(offchain_name, new_address)

print blockstack.lib.subdomains.make_subdomain_txt(full_name, onchain_name, new_address, seqn, zonefile, privk)

```

The program prints a string such as:

```
bar TXT "owner=1Jq3x8BAYz9Xy9AMfur5PXkDsWtmBBsNnC" "seqn=1" "parts=1" "zf0=JE9SSUdJTiBiYXIKJFRUTCAzNjAwCl9odHRwLl90Y3AJSU4JVVJJCTEwCTEJImh0dHBzOi8vZ2FpYS5ibG9ja3N0YWNrLm9yZy9odWIvMUpxM3g4QkFZejlYeTlBTWZ1cjVQWGtEc1d0bUJCc05uQy9wcm9maWxlLmpzb24iCgo\\=" "sig=QEA+88Nh6pqkXI9x3UhjIepiWEOsnO+u1bOBgqy+YyjrYIEfbYc2Q8YUY2n8sIQUPEO2wRC39bHQHAw+amxzJfkhAxcC/fZ0kYIoRlh2xPLnYkLsa5k2fCtXqkJAtsAttt/V"

```

(Note that the `sig=` field will differ between invocations, due to the way
ECDSA signatures work).

Once this TXT record has been submitted to the name's original registrar, the
registrar will pack it along with other such records into a single zone file,
and issue a `name-update` transaction for the on-chain name to announce them to
the rest of the peer network.  The registrar will then propagate these TXT
records to the peer network once the transaction confirms, thereby informing all
Blockstack nodes of the new state of the off-chain DID.

## 3.4 Deactivating a Stacks v2 DID

If the user wants to deactivate their DID, they can do so by revoking the underlying BNS name. The process is implemented slightly differently depending on whether an on-chain or an off-chain name is being revoked, but is in essence similar.  

To revoke an on-chain name, the current owner can construct and broadcast a [`name-revoke`](https://github.com/blockstack/stacks-blockchain/blob/master/src/chainstate/stacks/boot/bns.clar#L712) transaction signed with the appropriate key. Once the transaction is processed and accepted by the Stacks network, the BNS contract state will be updated to list the corresponding on-chain name as revoked. Attempting to resolve a Stacks V2 DID based on a revoked name will result in an error (as described in section 3.2.3).

In order to deactivate an off-chain name, the user can construct and broadcasts
a TXT record for the DID's underlying name that (1) changes the owner address
to a "nothing-up-my-sleeve" address (specifically `1111111111111111111114oLvT2` --
the base58-check encoding of 20 bytes of 0's, as [denoted here](https://github.com/jolocom/stacks-did-resolver/blob/main/src/constants.ts#L11)), and (2) changes the zone file to
include an unresolvable URL.  This prevents the DID from resolving, and prevents
it from being updated in the future.

## 3.5 Migration from legacy Stack v1 DIDs

The previously developed Blockstack `did:stack:` DID method ([defined
here](https://github.com/blockstack/stacks-blockchain/blob/stacks-1.0/docs/blockstack-did-spec.md#blockstack-did-method-specification)) allows users to derive a valid, resolvable `did:stack:` DID given a BNS name
they own, similarly to the approach outlined in this document.

Both the `did:stack` and `did:stack:v2` DID methods rely on the BNS system
(although different iterations of it) to enable the resolution of a DID to a
set of public keys via a BNS name.

As described in the [BNS documentation](https://docs.stacks.co/build-apps/references/bns), the Stacks v1 blockchain implemented BNS through first-order name operations (written to the underlying chain). In Stacks V2, the name system is instead implemented through a smart-contract loaded during the genesis block. The initial state of the BNS contract includes all names registered using the previous iteration of the Blockstack naming system.

Any valid *on-chain* v1 DID (e.g. `did:stack`) can therefore be easily updated
to a valid, resolvable Stacks v2 on-chain DID (given that the underlying BNS
name is resolvable via the BNS contract) by updating the NSI part of the DID in
accordance with the structure defined in this document. The general migration
steps for such a DID are:

1. Replace the `did:stack` DID Method identifier with `did:stack:v2`.
2. Extract the `address` and `index` values encoded in the NSI.
3. Discard the `index` value. In the new BNS system each principal can only hold
one on-chain name. The `index` part of the NSI needs to be replaced with the
identifier of the Stacks transaction which registered the name.
4. Given that the name record was migrated (i.e. included in the initial state
of the BNS contract during deployment, and not registered using a
`name-update`, `name-import`, etc. transaction) no Stacks transaction ID is
available to uniquely reference the registration. Instead, the identifier of
the contract deployment transaction can be used. The exact transaction identifiers are listed [here](https://github.com/jolocom/stacks-did-resolver/blob/feat/update-method-spec/src/constants.ts#L9).

In order to migrate an off-chain Stacks v1 DID, the off-chain name owner must request that the registrar that instantiated the name broadcasts a `name-update` operation anchoring the zone file. The identifier of the `name-update` operation can then be concatenated with the address of the off-chain name owner to produce a resolvable off-chain Stacks v2 DID. This additional step is required because there is no way to uniquely identify an off-chain name imported during contract deployment using only an the subdomain owner address. Additional information (specifically the name with which the subdomain is associated) which is not part of the DID's NSI would be required.

*A example, plus a link to a code snippet / test case will be included shortly.*

# 4. Security Considerations

This section briefly outlines possible ways to attack Blockstack's DID method,
as well as countermeasures the Blockstack protocol and the user can take to
defend against them.

## 4.1 Public Blockchain Attacks

Blockstack operates on top of a public blockchain, which could be attacked by a
sufficiently powerful adversary -- such as rolling back and changing the
chain's transaction history, denying new transactions for Blockstack's name
operations, or eclipsing nodes.

Blockstack makes the first two attacks difficult by operating on top of the most
secure blockchain -- currently Bitcoin.  If the blockchain is attacked, or a
stronger blockchain comes into being, the Blockstack community would migrate the
Blockstack network to a new blockchain.

The underlying blockchain provides some immunity towards eclipse attacks, since
a blockchain peer expects blocks to arrive at roughly fixed intervals and
expects blocks to have a proof of an expenditure of an expensive resource (like
electricity).  In Bitcoin's case, the computational difficulty of finding new
blocks puts a high lower bound on the computational effort required to eclipse a
Bitcoin node -- in order to sustain 10-minute block times, the attacker must
expend an equal amount of energy as the rest of the network.  Moreover, the
required expenditure rate (the "chain difficulty") decreases slowly enough that
an attacker with less energy would have to spend months of time on the attack,
giving the victim ample time to detect it.  The countermeasures the blockchain
employs to deter eclipse attacks are beyond the scope of this document, but it
is worth pointing out that Blockstack's DID method benefits from them since they
also help ensure that DID creation, updates and deletions get processed in a
timely manner.

## 4.2 Blockstack Peer Network Attacks

Because Blockstack stores each DID's DDO's URL in its own peer network outside
of its underlying blockchain, it is possible to eclipse Blockstack nodes and
prevent them from seeing both off-chain DID operations and updates to on-chain
DIDs.  In an effort to make this as difficult as possible, the Blockstack peer
network implements an unstructured overlay network -- nodes select a random
sample of the peer graph as their neighbors.  Moreover, Blockstack nodes strive
to fetch a full replica of all zone files, and pull zone files from their
neighbors in rarest-first order to prevent zone files from getting lost while
they are propagating.  This makes eclipsing a node maximally difficult -- an
attacker would need to disrupt all of a the victim node's neighbor links.

In addition to this protocol-level countermeasure, a user has the option of
uploading zone files manually to their preferred Blockstack nodes.  If  vigilant
users have access to a replica of the zone files, they can re-seed Blockstack
nodes that do not have them.

## 4.3 Stale Data and Replay Attacks

A DID's DDO is stored on a 3rd party storage provider.  The DDO's public key is
anchored to the blockchain, which means each time the DDO public key changes,
all previous DDOs are invalidated.  Similarly, the DDO's storage provider URLs
are anchored to the blockchain, which means each time the DID's zone file
changes, any stale DDOs will no longer be fetched.  However, if the user changes
other fields of their DDO, a malicious storage provider or a network adversary
can serve a stale but otherwise valid DDO and the resolver will accept it.

The user has a choice of which storage providers host their DDO.  If the storage
provider serves stale data, the user can and should change their storage
provider to one that will serve only fresh data.  In addition, the user should
use secure transport protocols like HTTPS to make replay attacks on the network
difficult.  For use cases where these are not sufficient to prevent replay
attacks, the user should change their zone file and/or public key each time they
change their DDO.

# 5. Privacy Considerations

Blockstack's DIDs are underpinned by Blockstack IDs (human readable names), and
every Blockstack node records where every DID's DDO is hosted.  However, users
have the option of encrypting their DDOs so that only a select set of other
users can decrypt them.

Blockstack's peer network and DID resolver use HTTP(S), meaning that
intermediate middleboxes like CDNs and firewalls can cache data and log
requests.

# 6. Reference Implementations

Blockstack implements a [RESTful API](https://core.blockstack.org/) for querying
DIDs.  It also implements a [reference
library](https://github.com/blockstack/blockstack.js) for generating well-formed
on-chain transactions, and it implements a [Python
library](https://github.com/blockstack/blockstack/core/blob/master/blockstack/lib/subdomains.py)
for generating off-chain DID operations.  The Blockstack node [reference
implementation](https://github.com/blockstack/blockstack-core) is available
under the terms of the General Public Licence, version 3.

# 7. Resources

Many Blockstack developers communicate via the [Blockstack
Forum](https://forum.blockstack.org/) and via the [Blockstack
Slack](https://blockstack.slack.com/).  Interested developers are encouraged to
join both.
