import { faPlusCircle as faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { RouteEntry } from '../../../../types/router.types'
import { Button } from '../components/Button'
import { PageTitle } from '../components/PageTitle'
import { SubmenuEntries } from '../layouts/parts/SubmenuEntries'
import { ThreeSectionsLayout } from '../layouts/parts/ThreeSectionsLayout'
import { myCollectionsRoute } from '../routes/routes'

export const MyCollectionsView: React.FC = () => {
  const { t } = useTranslation()
  const { collectionId } = myCollectionsRoute.useSearch()

  const collections: RouteEntry[] = [
    { id: 1, name: 'Favorites', to: '/my-collections', search: { collectionId: 1 } },
    { id: 2, name: 'Popular Science', to: '/my-collections', search: { collectionId: 2 } },
    { id: 3, name: 'Horrors', to: '/my-collections', search: { collectionId: 3 } },
  ]

  return (
    <>
      <ThreeSectionsLayout
        content={
          <div className="px-4 pb-36 lg:px-8">
            <div className="flex items-baseline justify-between">
              <PageTitle
                title={t('myCollectionsView_title')}
                subtitle={`${collectionId || 'All'}`}
              />
            </div>
          </div>
        }
        sidebar={
          <div className="px-2 pt-2">
            <Button
              label={t('myCollectionView_createCollection_button')}
              shape="rounded"
              size="xl"
              leadingIcon={<FontAwesomeIcon icon={faPlus} />}
              block
            />
            <SubmenuEntries className="pt-8" items={collections} />
          </div>
        }
      />
    </>
  )
}
