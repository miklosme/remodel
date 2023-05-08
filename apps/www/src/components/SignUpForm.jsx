import { useId, useRef, useState } from 'react'
import { Button } from '@/components/Button'
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/20/solid'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export function SignUpForm() {
  const id = useId()
  const form = useRef()
  const [subsciptionState, setSubscriptionState] = useState('idle')

  const handleSubmit = async (event) => {
    event.preventDefault()

    setSubscriptionState('pending')

    const response = await fetch(
      'https://buttondown.email/api/emails/embed-subscribe/miklosme',
      {
        method: 'POST',
        body: new FormData(form.current),
      }
    )

    if (response.status < 400) {
      setSubscriptionState('success')
    } else {
      setSubscriptionState('error')
    }
  }

  if (subsciptionState === 'success') {
    return (
      <div className="mt-4 rounded-md bg-white/10 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircleIcon
              className="h-5 w-5 text-white"
              aria-hidden="true"
            />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-white">
              Thank you for subscribing!
            </h3>
            <div className="mt-2 text-sm text-white">
              <p>Please check your inbox for a confirmation email.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (subsciptionState === 'error') {
    return (
      <div className="mt-4 rounded-md bg-white/10 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon
              className="mt-[1px] h-5 w-5 text-white"
              aria-hidden="true"
            />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-white">
              Something went wrong!
            </h3>
            <button
              onClick={() => setSubscriptionState('idle')}
              className="mt-2 text-sm text-white underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (subsciptionState === 'pending') {
    return (
      <div className="mt-4 rounded-md bg-white/10 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ClockIcon className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-white">Subscribing...</h3>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form
      ref={form}
      className="relative isolate mt-8 flex items-center pr-1"
      onSubmit={handleSubmit}
    >
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <input
        required
        type="email"
        autoComplete="email"
        name="email"
        id={id}
        placeholder="Email address"
        className="peer w-0 flex-auto bg-transparent px-4 py-2.5 text-base text-white placeholder:text-gray-400 focus:outline-none sm:text-[0.8125rem]/6"
      />
      <Button type="submit" arrow>
        Get updates
      </Button>
      <div className="absolute inset-0 -z-10 rounded-lg transition peer-focus:ring-4 peer-focus:ring-sky-300/15" />
      <div className="absolute inset-0 -z-10 rounded-lg bg-white/2.5 ring-1 ring-white/15 transition peer-focus:ring-white/20" />
    </form>
  )
}
