import { useCallback, useEffect, useState } from 'react'
import type { Delay } from '@gnosis.pm/zodiac'

import useAsync from '@/hooks/useAsync'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import useIntervalCounter from '@/hooks/useIntervalCounter'
import { getRecoveryState } from '@/services/recovery/recovery-state'
import { useAppDispatch } from '@/store'
import { isCustomTxInfo, isMultiSendTxInfo, isTransactionListItem } from '@/utils/transaction-guards'
import { sameAddress } from '@/utils/addresses'
import { addListener } from '@reduxjs/toolkit'
import { txHistorySlice } from '@/store/txHistorySlice'
import { RecoveryEvent, recoverySubscribe } from '@/services/recovery/recoveryEvents'
import type { AsyncResult } from '@/hooks/useAsync'
import type { RecoveryState } from '@/services/recovery/recovery-state'

const REFRESH_DELAY = 5 * 60 * 1_000 // 5 minutes

export function useRecoveryState(delayModifiers?: Array<Delay>): AsyncResult<RecoveryState> {
  const web3ReadOnly = useWeb3ReadOnly()
  const chain = useCurrentChain()
  const { safe, safeAddress } = useSafeInfo()
  const dispatch = useAppDispatch()

  // Reload recovery data every REFRESH_DELAY
  const [counter] = useIntervalCounter(REFRESH_DELAY)

  // Reload recovery data when manually triggered
  const [refetchDep, setRefetchDep] = useState(false)
  const refetch = useCallback(() => {
    setRefetchDep((prev) => !prev)
  }, [])

  // Reload recovery data when a Recoverer transaction occurs
  useEffect(() => {
    return recoverySubscribe(RecoveryEvent.PROCESSED, refetch)
  }, [refetch])

  // Reload recovery data when a Delay Modifier is interacted with
  useEffect(() => {
    if (!delayModifiers || delayModifiers.length === 0) {
      return
    }

    // We leverage a listener instead of useAsync dependencies because there are
    // that need be loaded before we can initially fetch the recovery state
    const listener = dispatch(
      addListener({
        // Listen to history polls (only occuring when the txHistoryTag changes)
        actionCreator: txHistorySlice.actions.set,
        effect: (action) => {
          // Get the most recent transaction
          const [latestTx] = action.payload.data?.results.filter(isTransactionListItem) ?? []

          if (!latestTx) {
            return
          }

          const { txInfo } = latestTx.transaction

          const isDelayModiferTx = delayModifiers.some((delayModifier) => {
            return isCustomTxInfo(txInfo) && sameAddress(txInfo.to.value, delayModifier.address)
          })

          // Refetch if the most recent transaction was with a Delay Modifier or MultiSend
          // (Multiple Delay Modifier settings changes are batched into a MultiSend)
          if (isDelayModiferTx || isMultiSendTxInfo(txInfo)) {
            refetch()
          }
        },
      }),
    )

    // Types are incorrect, but this ensures type safety
    const unsubscribe =
      listener instanceof Function
        ? (listener as unknown as typeof listener.payload.unsubscribe)
        : listener.payload.unsubscribe

    return unsubscribe
  }, [safe.chainId, delayModifiers, refetch, dispatch])

  return useAsync<RecoveryState>(
    () => {
      if (!delayModifiers || delayModifiers.length === 0 || !chain?.transactionService || !web3ReadOnly) {
        return
      }

      return getRecoveryState({
        delayModifiers,
        transactionService: chain.transactionService,
        safeAddress,
        provider: web3ReadOnly,
        chainId: safe.chainId,
        version: safe.version,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      delayModifiers,
      counter,
      refetchDep,
      chain?.transactionService,
      web3ReadOnly,
      safeAddress,
      safe.chainId,
      safe.version,
    ],
    false,
  )
}
