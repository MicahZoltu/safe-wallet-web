import { getChainLogo } from '@/config/chains'
import type { ReactElement } from 'react'
import { useMemo } from 'react'
import classnames from 'classnames'
import { useAppSelector } from '@/store'
import { selectChainById, selectChains } from '@/store/chainsSlice'
import css from './styles.module.css'
import useChainId from '@/hooks/useChainId'
import { Skeleton } from '@mui/material'
import { isEmpty } from 'lodash'

type ChainIndicatorProps = {
  chainId?: string
  inline?: boolean
  className?: string
  showUnknown?: boolean
  showLogo?: boolean
}

const fallbackChainConfig = {
  chainName: 'Unknown chain',
  chainId: '-1',
  theme: {
    backgroundColor: '#ddd',
    textColor: '#000',
  },
}

const ChainIndicator = ({
  chainId,
  className,
  inline = false,
  showUnknown = true,
  showLogo = true,
}: ChainIndicatorProps): ReactElement | null => {
  const currentChainId = useChainId()
  const id = chainId || currentChainId
  const chains = useAppSelector(selectChains)
  const chainConfig =
    useAppSelector((state) => selectChainById(state, id)) || (showUnknown ? fallbackChainConfig : null)
  const noChains = isEmpty(chains.data)

  const style = useMemo(() => {
    if (!chainConfig) return
    const { theme } = chainConfig

    return {
      backgroundColor: theme.backgroundColor,
      color: theme.textColor,
    }
  }, [chainConfig])

  return noChains ? (
    <Skeleton width="100%" height="22px" variant="rectangular" sx={{ flexShrink: 0 }} />
  ) : chainConfig ? (
    <span
      style={showLogo ? undefined : style}
      className={classnames(inline ? css.inlineIndicator : css.indicator, showLogo ? css.withLogo : '', className)}
    >
      {showLogo && (
        <img
          src={getChainLogo(chainConfig.chainId)}
          alt={`${chainConfig.chainName} Logo`}
          width={24}
          height={24}
          loading="lazy"
        />
      )}

      {chainConfig.chainName}
    </span>
  ) : null
}

export default ChainIndicator
