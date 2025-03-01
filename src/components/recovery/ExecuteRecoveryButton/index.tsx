import { Button, SvgIcon, Tooltip } from '@mui/material'
import { useContext } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

import RocketIcon from '@/public/images/transactions/rocket.svg'
import IconButton from '@mui/material/IconButton'
import CheckWallet from '@/components/common/CheckWallet'
import { dispatchRecoveryExecution } from '@/services/recovery/recovery-sender'
import useOnboard from '@/hooks/wallets/useOnboard'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useRecoveryTxState } from '@/hooks/useRecoveryTxState'
import { Errors, trackError } from '@/services/exceptions'
import { asError } from '@/services/exceptions/utils'
import { RecoveryListItemContext } from '../RecoveryListItem/RecoveryListItemContext'
import type { RecoveryQueueItem } from '@/services/recovery/recovery-state'

export function ExecuteRecoveryButton({
  recovery,
  compact = false,
}: {
  recovery: RecoveryQueueItem
  compact?: boolean
}): ReactElement {
  const { setSubmitError } = useContext(RecoveryListItemContext)
  const { isExecutable, isNext, isPending } = useRecoveryTxState(recovery)
  const onboard = useOnboard()
  const { safe } = useSafeInfo()

  const onClick = async (e: SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!onboard) {
      return
    }

    try {
      await dispatchRecoveryExecution({
        onboard,
        chainId: safe.chainId,
        args: recovery.args,
        delayModifierAddress: recovery.address,
      })
    } catch (_err) {
      const err = asError(_err)

      trackError(Errors._812, e)
      setSubmitError(err)
    }
  }

  return (
    <CheckWallet allowNonOwner>
      {(isOk) => {
        const isDisabled = !isOk || !isExecutable || isPending

        return (
          <Tooltip
            title={
              isDisabled
                ? isNext
                  ? 'You can execute the recovery after the specified review window'
                  : 'Previous recovery proposals must be executed or cancelled first'
                : null
            }
          >
            <span>
              {compact ? (
                <IconButton onClick={onClick} color="primary" disabled={isDisabled} size="small">
                  <SvgIcon component={RocketIcon} inheritViewBox fontSize="small" />
                </IconButton>
              ) : (
                <Button onClick={onClick} variant="contained" disabled={isDisabled} size="stretched">
                  Execute
                </Button>
              )}
            </span>
          </Tooltip>
        )
      }}
    </CheckWallet>
  )
}
