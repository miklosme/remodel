import Head from 'next/head'
import { ThemeProvider } from 'next-themes'
import { MDXProvider } from '@mdx-js/react'
import PlausibleProvider from 'next-plausible'
import { Layout } from '@/components/Layout'
import * as mdxComponents from '@/components/mdx'

import '@/styles/tailwind.css'
import 'focus-visible'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Remodel — AI-powered refactoring</title>
        <meta
          name="description"
          content="Remodel is an AI-driven developer tool designed to help software
          engineers migrate their old web applications to a new
          tech stack while preserving all original functionality. With support
          for JavaScript/TypeScript and React as the output, Remodel can refactor
          web apps from any language and framework."
        />
      </Head>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <MDXProvider components={mdxComponents}>
          <PlausibleProvider domain="remodel.sh">
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </PlausibleProvider>
        </MDXProvider>
      </ThemeProvider>
    </>
  )
}
