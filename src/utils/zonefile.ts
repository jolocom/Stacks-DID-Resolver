import { extractTokenFileUrl } from "./signedToken"
import { decodeFQN, encodeFQN, normalizeAddress } from "./general"
import "isomorphic-fetch"
import { Some, None, Maybe, Right, Left, Either } from "monet"
const { parseZoneFile } = require("zone-file")
const b58 = require("bs58")

export const ensureZonefileMatchesName = ({
  zonefile,
  name,
  namespace,
  subdomain,
}: {
  zonefile: string
  name: string
  namespace: string
  subdomain?: string
}): Either<Error, string> => {
  const parsedZoneFile = parseZoneFile(zonefile)
  const origin = decodeFQN(parsedZoneFile["$origin"])

  if (
    origin.name !== name ||
    origin.namespace !== namespace ||
    origin.subdomain !== subdomain
  ) {
    return Left(
      new Error(
        `Wrong zonefile, zf origin - ${JSON.stringify(
          origin
        )}, looking for ${encodeFQN({
          name,
          namespace,
          subdomain,
        })}`
      )
    )
  }

  return Right(zonefile)
}

const parseZoneFileTXT = (entries: string[]) =>
  entries.reduce(
    (parsed, current) => {
      const [prop, value] = current.split("=")

      if (prop.startsWith("zf")) {
        return { ...parsed, zonefile: `${parsed.zonefile}${value}` }
      }

      return { ...parsed, [prop]: value }
    },
    { zonefile: "", owner: "" }
  )

// TODO return the subdomain here
export const findSubdomainZonefile = (
  nameZonefile: string,
  owner: string
): Either<
  Error,
  {
    zonefile: string
    subdomain: string
  }
> => {
  const parsedZoneFile = parseZoneFile(nameZonefile)

  if (parsedZoneFile.txt) {
    const match = parsedZoneFile.txt.find(
      (arg: { txt: string[]; name: string }) => {
        return parseZoneFileTXT(arg.txt).owner === normalizeAddress(owner)
      }
    )

    if (match) {
      return Right({
        subdomain: match.name,
        zonefile: Buffer.from(
          parseZoneFileTXT(match.txt).zonefile,
          "base64"
        ).toString("ascii"),
      })
    }
  }

  return Left(new Error("No zonefile for subdomain found"))
}

export const parseZoneFileAndExtractNameinfo = (zonefile: string) => {
  const parsedZf = parseZoneFile(zonefile)

  const { name, namespace, subdomain } = decodeFQN(parsedZf["$origin"])

  return extractTokenFileUrl(zonefile).map((url) => ({
    name,
    namespace,
    subdomain,
    tokenUrl: url,
  }))
}

export const parseZoneFileAndExtractTokenUrl = (
  zonefile: string
): Either<Error, string> => {
  const parsedZf = parseZoneFile(zonefile)

  const { name, namespace, subdomain } = decodeFQN(parsedZf["$origin"])

  return ensureZonefileMatchesName({
    zonefile,
    name,
    namespace,
    subdomain,
  }).flatMap(extractTokenFileUrl)
}
