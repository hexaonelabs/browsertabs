import { useEffect, useRef, useState } from 'react'
import './Popup.css'
import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/react'

// chrome.storage
const getDatasFromChromeStorageAPI = async () => {
  // get db
  const {
    browsertabs: { data } = { data: [] },
  } = await (chrome.storage.sync.get('browsertabs') as Promise<{
    browsertabs: {
      data: {
        title: string
        tabs: { id: string; title: string; url: string; groupId: string }[]
        id: string
      }[]
    }
  }>)
  return data
}
const saveToChromeStorageAPI = async (value: {
  id: string
  title: string
  tabs: { title?: string; url?: string; groupId: string }[]
}) => {
  // get db
  const data = await getDatasFromChromeStorageAPI()
  console.log({ data })
  // update existing group
  await chrome.storage.sync.set({
    browsertabs: {
      data: [...data, value],
    },
  })
}

function App() {
  const groupNameModal = useRef<HTMLIonModalElement>(null)
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([])
  const [groups, setGroups] = useState<
    {
      tabs: {
        id: string
        title: string
        url: string
        groupId: string
      }[]
      title: string
      id: string
    }[]
  >([])
  const [segmentValue, setSegmentValue] = useState<'TABS' | 'GROUPS'>('TABS')
  const collator = new Intl.Collator()

  const loadTabs = async () => {
    const tabs = await chrome?.tabs?.query({
      currentWindow: true,
      groupId: -1,
    })
    setTabs(tabs.sort((a, b) => collator.compare(`${a.title}`, `${b.title}`)))
  }

  const loadGroups = async () => {
    const groups = await getDatasFromChromeStorageAPI()
    setGroups(groups)
  }

  const deleteGroup = async (id: string) => {
    const data = await getDatasFromChromeStorageAPI()
    const newData = data.filter((group) => group.id !== id)
    await chrome.storage.sync.set({
      browsertabs: {
        data: newData,
      },
    })
    await loadGroups()
  }

  useEffect(() => {
    loadTabs()
    loadGroups()
  }, [])

  return (
    <>
      <IonHeader translucent>
        <IonToolbar className="ion-no-border">
          <IonSegment
            value={segmentValue}
            onIonChange={(event) => {
              setSegmentValue(event.detail.value as any)
            }}
          >
            <IonSegmentButton value="TABS">
              <IonLabel>CURRENT TABS</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="GROUPS">
              <IonLabel>GROUPS</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      {segmentValue === 'TABS' && (
        <>
          <IonContent className="ion-no-padding">
            <IonList>
              {tabs.map((tab, index) => {
                const title = `${tab.title}`.split('-')[0].trim()
                const pathname = `${tab.url}`
                const faviconUrl = tab.favIconUrl
                return (
                    <IonItem
                      key={index}
                      onClick={async () => {
                        await chrome.tabs.update(tab.id || 0, { active: true })
                        await chrome.windows.update(tab.windowId, { focused: true })
                      }}
                    >
                      {faviconUrl && (
                        <IonAvatar slot="start">
                          <img src={faviconUrl} alt="favicon" />
                        </IonAvatar>
                      )}
                      <IonLabel>
                        <h3 className="title">{title}</h3>
                        <p className="pathname">{pathname}</p>
                      </IonLabel>
                    </IonItem>
                )
              })}
            </IonList>
          </IonContent>
          <IonFooter translucent>
            <IonToolbar className="ion-no-border">
              <IonButton
                id="open-modal"
                shape="round"
                expand="block"
                className="ion-margin-horizontal"
              >
                Save & close Tabs
              </IonButton>
            </IonToolbar>
          </IonFooter>

          {/* GroupName Modal */}
          <IonModal ref={groupNameModal} trigger="open-modal" initialBreakpoint={0.25}>
            <IonContent className="ion-padding">
              <IonInput
                id="group-name-input"
                label="Group name"
                labelPlacement="stacked"
                fill="outline"
                type="text"
              />
              <IonButton
                shape="round"
                expand="block"
                className="ion-margin-top"
                onClick={async () => {
                  const { value: title } = document.getElementById(
                    'group-name-input',
                  ) as HTMLIonInputElement
                  const id = Date.now().toString()
                  await saveToChromeStorageAPI({
                    id,
                    title: `${title}`,
                    tabs: tabs.map(({ title, url }) => ({ title, url, groupId: id })),
                  })
                  // close modal
                  await groupNameModal.current?.dismiss()
                  // create new clean tab
                  await chrome.tabs.create({
                    active: false,
                    index: (tabs.length || 1) - 1,
                  })
                  // close all tabs
                  await chrome.tabs.remove(tabs.map(({ id }) => id || 0))
                }}
              >
                Save & close
              </IonButton>
            </IonContent>
          </IonModal>
        </>
      )}
      {segmentValue === 'GROUPS' && (
        <>
          <IonContent className="ion-no-padding">
            <IonList>
              {groups.map((group, index) => {
                const title = `${group.title || group.id}`
                return (
                  <IonItemSliding id={'ion-item-slide-' + index} key={index}>
                    <IonItem
                      onClick={async () => {
                        const { tabs } = group
                        // create all tabs from `group.tabs`
                        for (let index = 0; index < tabs.length; index++) {
                          const { url } = tabs[index]
                          await chrome.tabs.create({
                            active: false,
                            url,
                            index,
                          })
                        }
                        // // close current active tab
                        // const currentActiveTab = await chrome.tabs.query({ active: true })
                        // await chrome.tabs.remove(currentActiveTab.map(({ id }) => id || 0))
                      }}
                    >
                      <IonLabel>
                        <h3 className="title">{title}</h3>
                      </IonLabel>
                      <IonButton slot="end">open</IonButton>
                    </IonItem>
                    <IonItemOptions>
                      <IonItemOption
                        type="button"
                        color="danger"
                        onClick={async () => {
                          const ionSliding = document.getElementById(
                            'ion-item-slide-' + index,
                          ) as HTMLIonItemSlidingElement
                          await ionSliding.close()
                          await deleteGroup(group.id)
                        }}
                      >
                        Delete
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                )
              })}
            </IonList>
          </IonContent>
        </>
      )}
    </>
  )
}

export default App
