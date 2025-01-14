import { formatVisualAmount } from '@/utils/formatters'
import { Skeleton } from '@mui/material'
import { type BigNumber } from 'ethers'
import { useCurrentChain } from '@/hooks/useChains'

const WalletBalance = ({ balance }: { balance: BigNumber | undefined }) => {
  const currentChain = useCurrentChain()

  if (!balance) {
    return <Skeleton width={30} variant="text" sx={{ display: 'inline-block' }} />
  }

  return (
    <>
      {formatVisualAmount(balance, currentChain?.nativeCurrency.decimals ?? 18)}{' '}
      {currentChain?.nativeCurrency.symbol ?? 'ETH'}
    </>
  )
}

export default WalletBalance
