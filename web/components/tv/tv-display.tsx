import clsx from 'clsx'
import { useState } from 'react'
import Link from 'next/link'
import Router from 'next/router'

import { Contract, tradingAllowed } from 'common/contract'
import { SEO } from 'web/components/SEO'
import { SignedInBinaryMobileBetting } from 'web/components/bet/bet-button'
import { Button } from 'web/components/buttons/button'
import { BinaryResolutionOrChance } from 'web/components/contract/contract-price'
import { Col } from 'web/components/layout/col'
import { Page } from 'web/components/layout/page'
import { Row } from 'web/components/layout/row'
import { useUser } from 'web/hooks/use-user'
import { Linkify } from 'web/components/widgets/linkify'
import { useAdminOrMod } from 'web/hooks/use-admin'
import { SimpleMultiOverview } from 'web/components/contract/contract-overview'
import { PublicChat } from 'web/components/chat/public-chat'
import { Tabs } from 'web/components/layout/tabs'
import { useIsMobile } from 'web/hooks/use-is-mobile'
import { ScheduleItem } from './tv-schedule'
import { ScheduleTVModal } from './schedule-tv-modal'
import { DOMAIN } from 'common/envs/constants'
import { Presence } from './tv-page'
import { sortBy } from 'lodash'
import { Avatar } from '../widgets/avatar'
import { buildArray } from 'common/util/array'

export function TVDisplay(props: {
  contract: Contract
  stream?: ScheduleItem
  watchers?: Presence[]
}) {
  const { contract, stream, watchers } = props

  const user = useUser()

  const isMod = useAdminOrMod()
  const showModify = user?.id === stream?.creator_id || isMod

  const isMobile = useIsMobile(1280) //xl
  const [showSettings, setShowSettings] = useState(false)

  const isBinary = contract.outcomeType === 'BINARY'
  const isMulti =
    contract.outcomeType === 'MULTIPLE_CHOICE' &&
    contract.mechanism === 'cpmm-multi-1'

  const betPanel = (
    <>
      {tradingAllowed(contract) && isBinary && (
        <SignedInBinaryMobileBetting contract={contract} user={user} />
      )}
      {tradingAllowed(contract) && isMulti && (
        <SimpleMultiOverview contract={contract} />
      )}
    </>
  )

  const channelId = `tv-${stream?.id ?? 'default'}`

  const streamSrc =
    stream?.source === 'twitch'
      ? `https://player.twitch.tv/?channel=${stream.stream_id}&parent=${
          DOMAIN /*&&'localhost'*/
        }&autoplay=true`
      : 'https://www.youtube.com/embed/' + stream?.stream_id + '?autoplay=1'

  return (
    <Page trackPageView="tv page" className="!mt-0 xl:col-span-10 xl:pr-0">
      <SEO
        title={`${stream?.title} on Manifold TV`}
        description={`Watch the stream and bet on ${contract.question}`}
        url={`/tv/${stream?.id}`}
        image={contract.coverImageUrl}
      />
      <Row className="w-full items-start">
        <Col className={clsx('bg-canvas-0 w-full rounded-b ')}>
          <iframe
            src={streamSrc}
            title="Manifold Live video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="bg-canvas-0 h-[300px] w-full lg:h-[500px]"
          />

          <Col className="mb-2 p-4 md:pb-8 lg:px-8">
            <Row className="justify-between gap-4">
              <Row className="gap-2 text-xl font-medium sm:text-2xl">
                <Link
                  href={`/${contract.creatorUsername}/${contract.slug}`}
                  target="_blank"
                  className="hover:underline"
                >
                  <Linkify text={contract.question} />
                </Link>
              </Row>
              {isBinary && (
                <BinaryResolutionOrChance isCol contract={contract} />
              )}
            </Row>
            {isMobile ? (
              <Tabs
                tabs={buildArray([
                  { title: 'Market', content: betPanel },
                  {
                    title: 'Chat',
                    content: (
                      <PublicChat
                        channelId={channelId}
                        key={channelId}
                        className="bg-canvas-50"
                      />
                    ),
                  },
                  watchers && {
                    title: `${watchers.length} Viewers`,
                    content: <Watchers watchers={watchers} />,
                  },
                ])}
              />
            ) : (
              betPanel
            )}
          </Col>

          <Row className="m-4 gap-4">
            {showModify && (
              <Button
                color="indigo-outline"
                onClick={() => setShowSettings(true)}
              >
                Modify event
              </Button>
            )}
            <Button
              color="indigo-outline"
              onClick={() => Router.push('/tv/schedule')}
            >
              See schedule
            </Button>
            <ScheduleTVModal
              open={showSettings}
              setOpen={() => setShowSettings(false)}
              stream={stream}
              slug={contract.slug}
            />
          </Row>
        </Col>

        <Col className="sticky top-0 ml-4 hidden h-screen w-[300px] max-w-[375px] xl:flex xl:w-[350px]">
          {watchers && (
            <div className="text-ink-500">
              <div>{watchers.length} viewers</div>
              <Watchers watchers={watchers} limit={10} />
            </div>
          )}
          <div className={'border-b-2 py-2 text-xl text-indigo-700'}>
            Live chat
          </div>
          <PublicChat
            channelId={channelId}
            key={channelId}
            className="min-h-0 grow"
          />
        </Col>
      </Row>
    </Page>
  )
}

const Watchers = (props: { watchers: Presence[]; limit?: number }) => {
  const { watchers, limit } = props
  const sorted = sortBy(watchers, 'onlineAt')
  const displayed = limit ? sorted.slice(-limit) : sorted.reverse()

  return (
    <div className="flex flex-wrap gap-1 py-1">
      {displayed.map((watcher) => (
        <Avatar
          key={watcher.id}
          username={watcher.username}
          avatarUrl={watcher.avatarUrl}
          size="sm"
        />
      ))}
    </div>
  )
}
