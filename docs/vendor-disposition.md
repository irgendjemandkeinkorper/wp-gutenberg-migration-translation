# Vendor template source disposition

The historical `gn-wp-templates/` vendor tree was removed from the working tree in issue #42. A repository-wide reference scan found no source, script, or test dependency on that directory. Blockify currently stores target template names and metadata; it does not compile or ship the raw vendor theme source.

The removed bytes remain in prior Git history, but the tree is no longer tracked or allowed to grow in the active working tree. If future profile work requires raw theme source, it must use a separately governed repository or artifact store rather than restoring this unbounded vendor directory.
