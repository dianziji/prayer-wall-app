import AdminClientNew from './admin-client-new'

type Props = {
  currentWall: any
  userRoles: any[]
  weekStart: string
}

export default function AdminClient(props: Props) {
  return <AdminClientNew {...props} />
}