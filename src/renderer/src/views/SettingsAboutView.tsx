import { useTranslation } from 'react-i18next'

export const SettingsAboutView: React.FC = () => {
  const { t } = useTranslation()

  return (
    <main className="px-8">
      <h2 className="text-2xl font-semibold">{t('settings_subsection_about_title')}</h2>
      <div className="mt-8">Developed by Garfild (2023-{new Date().getFullYear()})</div>
      <h3 className="pb-4 pt-8 text-xl font-semibold">Credits</h3>
      <div>
        <div>
          <a href="https://www.freepik.com/free-photo/vintage-grunge-paper-background_5405364.htm#query=book%20texture&position=0&from_view=search&track=ais&uuid=87ddd130-c387-41fc-8160-132f3f3146bb">
            Image by kjpargeter
          </a>{' '}
          on Freepik
        </div>

        <div>
          <a href="https://www.freepik.com/free-photo/sepia-plasterboard-texture_17556731.htm#query=book%20texture&position=5&from_view=search&track=ais&uuid=87ddd130-c387-41fc-8160-132f3f3146bb">
            Image by efe_madrid
          </a>{' '}
          on Freepik
        </div>

        <div>
          <a href="https://www.freepik.com/free-photo/paperboard-texture_4896372.htm#query=book%20texture&position=8&from_view=search&track=ais&uuid=87ddd130-c387-41fc-8160-132f3f3146bb">
            Image by efe_madrid
          </a>{' '}
          on Freepik
        </div>

        <div>
          <a href="https://www.freepik.com/free-photo/smooth-white-stucco-wall_1037198.htm#query=book%20texture&position=11&from_view=search&track=ais&uuid=87ddd130-c387-41fc-8160-132f3f3146bb">
            Image by kues1
          </a>{' '}
          on Freepik
        </div>

        <div>
          <a href="https://www.freepik.com/free-vector/blank-cream-notepaper-design_13311373.htm#query=book%20paper&position=5&from_view=search&track=ais&uuid=70155a95-23c9-48c4-abfb-f83234e9a4f3">
            Image by rawpixel.com
          </a>{' '}
          on Freepik
        </div>

        <div>
          <a href="https://www.freepik.com/free-photo/fabric-texture-background_17197741.htm#query=book%20texture%20dark&position=10&from_view=search&track=ais&uuid=f74b7816-4712-4531-a082-7383ce27f5b6">
            Image by vector_corp
          </a>{' '}
          on Freepik
        </div>

        <div>
          <a href="https://www.freepik.com/free-photo/black-concrete-textured-background_19140670.htm#query=book%20texture%20dark&position=48&from_view=search&track=ais&uuid=f74b7816-4712-4531-a082-7383ce27f5b6">
            Image by rawpixel.com
          </a>{' '}
          on Freepik
        </div>

        <div>
          <a href="https://www.freepik.com/free-photo/dark-blue-plain-textured-background-fabric-block-prints_16463853.htm#page=4&query=book%20texture%20dark&position=3&from_view=search&track=ais&uuid=f74b7816-4712-4531-a082-7383ce27f5b6">
            Image by rawpixel.com
          </a>{' '}
          on Freepik
        </div>

        <div>
          <a href="https://www.freepik.com/free-photo/textile-material-texture_1204762.htm#page=4&query=book%20texture%20dark&position=11&from_view=search&track=ais&uuid=f74b7816-4712-4531-a082-7383ce27f5b6">
            Image by nikitabuida
          </a>{' '}
          on Freepik
        </div>

        <div>
          <a href="https://www.freepik.com/free-photo/grunge-with-decorative-frame_12570147.htm#page=5&query=book%20texture%20dark&position=11&from_view=search&track=ais&uuid=f74b7816-4712-4531-a082-7383ce27f5b6">
            Image by kjpargeter
          </a>{' '}
          on Freepik
        </div>

        <div>
          Image by{' '}
          <a href="https://www.freepik.com/free-photo/top-view-leather-texture-background_12095498.htm#query=book%20cover%20texture%20leather&position=13&from_view=search&track=ais&uuid=89895f16-6f73-47a0-950f-d16541bb4349">
            Freepik
          </a>
        </div>

        <div>
          <a href="https://www.freepik.com/free-photo/pink-leather-grain-texture_4640671.htm#query=book%20cover%20texture%20leather&position=8&from_view=search&track=ais&uuid=89895f16-6f73-47a0-950f-d16541bb4349">
            Image by rawpixel.com
          </a>{' '}
          on Freepik
        </div>

        <div>
          <a href="https://www.freepik.com/free-photo/dark-green-creased-leather-textured-background_17119408.htm#query=book%20cover%20texture%20leather&position=4&from_view=search&track=ais&uuid=89895f16-6f73-47a0-950f-d16541bb4349">
            Image by rawpixel.com
          </a>{' '}
          on Freepik
        </div>

        <div>
          <a href="https://www.freepik.com/free-photo/blue-creased-leather-textured-background_17850335.htm#query=book%20cover%20texture%20leather&position=3&from_view=search&track=ais&uuid=89895f16-6f73-47a0-950f-d16541bb4349">
            Image by rawpixel.com
          </a>{' '}
          on Freepik
        </div>

        <div>
          <a href="https://www.freepik.com/free-photo/brown-creased-leather-textured-background_16015633.htm#query=book%20cover%20texture%20leather&position=12&from_view=search&track=ais&uuid=89895f16-6f73-47a0-950f-d16541bb4349">
            Image by rawpixel.com
          </a>{' '}
          on Freepik
        </div>

        <div>
          Image by{' '}
          <a href="https://www.freepik.com/free-photo/notebook-with-black-cover_2273861.htm#query=book%20cover%20placeholder&position=1&from_view=search&track=ais&uuid=ae3c3792-6bea-4281-8ce2-299268b7b281">
            Freepik
          </a>
        </div>
      </div>
    </main>
  )
}
