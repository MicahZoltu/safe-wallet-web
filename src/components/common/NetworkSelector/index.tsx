import ChainIndicator from '@/components/common/ChainIndicator'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import Link from 'next/link'
import type { SelectChangeEvent } from '@mui/material'
import { ListSubheader, MenuItem, Select, Skeleton, Tooltip } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import useChains from '@/hooks/useChains'
import { useRouter } from 'next/router'
import css from './styles.module.css'
import { useChainId } from '@/hooks/useChainId'
import { type ReactElement, forwardRef } from 'react'
import { useCallback } from 'react'
import { AppRoutes } from '@/config/routes'
import { trackEvent, OVERVIEW_EVENTS } from '@/services/analytics'
import useWallet from '@/hooks/wallets/useWallet'
import { isSocialWalletEnabled } from '@/hooks/wallets/wallets'
import { isSocialLoginWallet } from '@/services/mpc/SocialLoginModule'

const keepPathRoutes = [AppRoutes.welcome.index, AppRoutes.newSafe.create, AppRoutes.newSafe.load]

const MenuWithTooltip = forwardRef<HTMLUListElement>(function MenuWithTooltip(props: any, ref) {
  return (
    <Tooltip title="More network support coming soon" arrow placement="left">
      <ul ref={ref} {...props}>
        {props.children}
      </ul>
    </Tooltip>
  )
})

const isTestnet = (shortName: string) => {
  return shortName === 'gor' || shortName === 'base-gor' || shortName === 'sep'
}

const NetworkSelector = (props: { onChainSelect?: () => void }): ReactElement => {
  const wallet = useWallet()
  const { configs } = useChains()
  const chainId = useChainId()
  const router = useRouter()
  const getNetworkLink = useCallback(
    (shortName: string) => {
      const shouldKeepPath = keepPathRoutes.includes(router.pathname)

      const route = {
        pathname: shouldKeepPath ? router.pathname : '/',
        query: {
          chain: shortName,
        } as {
          chain: string
          safeViewRedirectURL?: string
        },
      }

      if (router.query?.safeViewRedirectURL) {
        route.query.safeViewRedirectURL = router.query?.safeViewRedirectURL.toString()
      }

      return route
    },
    [router],
  )

  const onChange = (event: SelectChangeEvent) => {
    event.preventDefault() // Prevent the link click

    const newChainId = event.target.value
    const shortName = configs.find((item) => item.chainId === newChainId)?.shortName

    if (shortName) {
      trackEvent({ ...OVERVIEW_EVENTS.SWITCH_NETWORK, label: newChainId })
      router.push(getNetworkLink(shortName))
    }
  }

  const isSocialLogin = isSocialLoginWallet(wallet?.label)

  const renderMenuItem = useCallback(
    (value: string, chain: ChainInfo) => {
      return (
        <MenuItem
          key={value}
          value={value}
          className={css.menuItem}
          disabled={isSocialLogin && !isSocialWalletEnabled(chain)}
        >
          <Link href={getNetworkLink(chain.shortName)} onClick={props.onChainSelect} className={css.item}>
            <ChainIndicator chainId={chain.chainId} inline />
          </Link>
        </MenuItem>
      )
    },
    [getNetworkLink, isSocialLogin, props.onChainSelect],
  )

  return configs.length ? (
    <Select
      value={chainId}
      onChange={onChange}
      size="small"
      className={css.select}
      variant="standard"
      IconComponent={ExpandMoreIcon}
      MenuProps={{
        transitionDuration: 0,
        MenuListProps: { component: isSocialLogin ? MenuWithTooltip : undefined },
        sx: {
          '& .MuiPaper-root': {
            overflow: 'auto',
          },
        },
      }}
      sx={{
        '& .MuiSelect-select': {
          py: 0,
        },
      }}
    >
      {configs.filter((config) => !isTestnet(config.shortName)).map((chain) => renderMenuItem(chain.chainId, chain))}
      <ListSubheader className={css.listSubHeader}>Testnets</ListSubheader>
      {configs.filter((config) => isTestnet(config.shortName)).map((chain) => renderMenuItem(chain.chainId, chain))}
    </Select>
  ) : (
    <Skeleton width={94} height={31} sx={{ mx: 2 }} />
  )
}

export default NetworkSelector
