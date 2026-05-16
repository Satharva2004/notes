const dedupeEditHistory = (note) =>
  Array.from(
    (note.editHistory || [])
      .reduce((editors, entry) => {
        editors.set(entry.email, {
          name: entry.name,
          email: entry.email,
          edited_at: entry.editedAt,
        });

        return editors;
      }, new Map())
      .values()
  );

export const toNoteResponse = (note, owner) => ({
  id: note._id.toString(),
  title: note.title,
  content: note.content,
  font_family: note.fontFamily,
  created_at: note.createdAt,
  updated_at: note.updatedAt,
  share_name: note.shareName,
  owner_username: owner?.username || note.owner?.username,
  share_permission: note.sharePermission || "viewer",
  edited_by: dedupeEditHistory(note),
});

export const toSharedNoteResponse = (note) => ({
  ...toNoteResponse(note),
  permission: note.sharePermission || "viewer",
});
