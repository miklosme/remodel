import { useId } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/Button'
import { CheckCircleIcon } from '@heroicons/react/20/solid'

export function SignUpForm() {
  let id = useId()
  let router = useRouter()

  if (router.query.subscribed) {
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

  return (
    <form
      action="https://buttondown.email/api/emails/embed-subscribe/miklosme"
      method="post"
      target="popupwindow"
      onSubmit={() => {
        window.open('https://buttondown.email/miklosme', 'popupwindow')
      }}
      className="relative isolate mt-8 flex items-center pr-1"
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
        className="peer w-0 flex-auto bg-transparent px-4 py-2.5 text-base text-white placeholder:text-gray-500 focus:outline-none sm:text-[0.8125rem]/6"
      />
      <Button type="submit" arrow>
        Get updates
      </Button>
      <div className="absolute inset-0 -z-10 rounded-lg transition peer-focus:ring-4 peer-focus:ring-sky-300/15" />
      <div className="absolute inset-0 -z-10 rounded-lg bg-white/2.5 ring-1 ring-white/15 transition peer-focus:ring-sky-300" />
    </form>
  )
}
